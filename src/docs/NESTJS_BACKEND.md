# NestJS Backend Specification

## Overview
This document provides specifications for the NestJS backend that handles authentication, multi-tenancy, and API endpoints.

---

## 1. Project Structure

```
src/
├── main.ts
├── app.module.ts
│
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── guards/
│   │   ├── clerk-auth.guard.ts
│   │   └── roles.guard.ts
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── current-org.decorator.ts
│   │   └── roles.decorator.ts
│   └── strategies/
│       └── clerk.strategy.ts
│
├── organizations/
│   ├── organizations.module.ts
│   ├── organizations.controller.ts
│   └── organizations.service.ts
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   └── users.service.ts
│
├── calls/
│   ├── calls.module.ts
│   ├── calls.controller.ts
│   └── calls.service.ts
│
├── messages/
│   ├── messages.module.ts
│   ├── messages.controller.ts
│   └── messages.service.ts
│
├── templates/
│   ├── templates.module.ts
│   ├── templates.controller.ts
│   └── templates.service.ts
│
├── billing/
│   ├── billing.module.ts
│   ├── billing.controller.ts
│   └── billing.service.ts
│
├── webhooks/
│   ├── webhooks.module.ts
│   ├── webhooks.controller.ts
│   └── handlers/
│       ├── twilio.handler.ts
│       ├── stripe.handler.ts
│       └── n8n-callback.handler.ts
│
└── common/
    ├── interceptors/
    │   └── tenant.interceptor.ts
    ├── filters/
    │   └── http-exception.filter.ts
    └── pipes/
        └── validation.pipe.ts
```

---

## 2. Authentication Guard (Clerk)

```typescript
// auth/guards/clerk-auth.guard.ts

import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { clerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    try {
      // Verify the session token with Clerk
      const session = await clerkClient.sessions.verifySession(
        request.headers['x-clerk-session-id'],
        token
      );

      // Get user details
      const user = await clerkClient.users.getUser(session.userId);
      
      // Attach to request
      request.clerkUser = user;
      request.clerkSession = session;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return null;
    return authHeader.substring(7);
  }
}
```

---

## 3. Roles Guard

```typescript
// auth/guards/roles.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';

export type Role = 'owner' | 'agent';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const clerkUserId = request.clerkUser?.id;

    if (!clerkUserId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user from database with role
    const user = await this.usersService.findByClerkId(clerkUserId);
    
    if (!user || !user.is_active) {
      throw new ForbiddenException('User not found or inactive');
    }

    // Attach user to request
    request.user = user;
    request.organizationId = user.organization_id;

    // Check role
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

---

## 4. Tenant Isolation Interceptor

```typescript
// common/interceptors/tenant.interceptor.ts

import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private dataSource: DataSource) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const organizationId = request.organizationId;

    if (organizationId) {
      // Set the organization context for RLS
      await this.dataSource.query(
        `SET LOCAL app.current_org_id = '${organizationId}'`
      );
    }

    return next.handle();
  }
}
```

---

## 5. User Signup Controller

```typescript
// auth/auth.controller.ts

import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';

class SignupDto {
  clerkUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationName: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(@Body() dto: SignupDto) {
    return this.authService.registerUserWithOrganization(dto);
  }

  @Public()
  @Post('webhook/clerk')
  @HttpCode(HttpStatus.OK)
  async handleClerkWebhook(@Body() payload: any) {
    // Handle Clerk webhooks for user creation, updates, deletions
    return this.authService.handleClerkWebhook(payload);
  }
}
```

---

## 6. Auth Service (Organization Creation)

```typescript
// auth/auth.service.ts

import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Organization } from '../organizations/organization.entity';
import { User } from '../users/user.entity';
import { Subscription } from '../billing/subscription.entity';
import { slugify } from '../common/utils/slugify';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Organization)
    private orgRepo: Repository<Organization>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Subscription)
    private subRepo: Repository<Subscription>,
    private dataSource: DataSource,
  ) {}

  async registerUserWithOrganization(dto: {
    clerkUserId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    organizationName: string;
  }) {
    // Check if user already exists
    const existingUser = await this.userRepo.findOne({
      where: { clerk_user_id: dto.clerkUserId },
    });

    if (existingUser) {
      throw new ConflictException('User already registered');
    }

    // Use transaction for atomicity
    return this.dataSource.transaction(async (manager) => {
      // 1. Create organization
      const slug = await this.generateUniqueSlug(dto.organizationName);
      const organization = manager.create(Organization, {
        name: dto.organizationName,
        slug,
      });
      await manager.save(organization);

      // 2. Create user as owner
      const user = manager.create(User, {
        clerk_user_id: dto.clerkUserId,
        organization_id: organization.id,
        email: dto.email,
        first_name: dto.firstName,
        last_name: dto.lastName,
        role: 'owner',
        is_active: true,
      });
      await manager.save(user);

      // 3. Create trial subscription
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

      const subscription = manager.create(Subscription, {
        organization_id: organization.id,
        status: 'trialing',
        messages_limit: 100, // Trial limit
        phone_numbers_limit: 1,
        team_members_limit: 2,
        current_period_start: new Date(),
        current_period_end: trialEnd,
        trial_end: trialEnd,
      });
      await manager.save(subscription);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        subscription: {
          status: subscription.status,
          trialEndsAt: subscription.trial_end,
        },
      };
    });
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let baseSlug = slugify(name);
    let slug = baseSlug;
    let counter = 1;

    while (await this.orgRepo.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
```

---

## 7. Decorators

```typescript
// auth/decorators/current-user.decorator.ts

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

// auth/decorators/current-org.decorator.ts

export const CurrentOrg = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.organizationId;
  },
);

// auth/decorators/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';
import { Role } from '../guards/roles.guard';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

// auth/decorators/public.decorator.ts

import { SetMetadata } from '@nestjs/common';

export const Public = () => SetMetadata('isPublic', true);
```

---

## 8. Example Protected Controller

```typescript
// calls/calls.controller.ts

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from '../auth/guards/clerk-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentOrg } from '../auth/decorators/current-org.decorator';
import { CallsService } from './calls.service';

@Controller('calls')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class CallsController {
  constructor(private callsService: CallsService) {}

  @Get()
  @Roles('owner', 'agent') // Both roles can view calls
  async findAll(
    @CurrentOrg() organizationId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.callsService.findAll(organizationId, { page, limit });
  }

  @Get('stats')
  @Roles('owner') // Only owners can view stats
  async getStats(@CurrentOrg() organizationId: string) {
    return this.callsService.getStats(organizationId);
  }
}
```

---

## 9. Security Best Practices

1. **Never trust client-provided organization ID**
   - Always derive from authenticated user's association

2. **Use transactions for multi-table operations**
   - Signup creates org + user + subscription atomically

3. **Validate Clerk webhooks**
   - Use Svix for webhook signature verification

4. **Rate limit public endpoints**
   - Use @nestjs/throttler for signup/webhook endpoints

5. **Audit logging**
   - Log all sensitive operations with user and org context
