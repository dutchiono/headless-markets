import { Args, Query, Resolver } from '@nestjs/graphql';
import { Ctx, RequestContext } from '@vendure/core';
import { AgentService } from '../services/agent.service';

/**
 * Shop GraphQL Resolver
 * 
 * Handles shop/customer API operations (read-only)
 */
@Resolver()
export class AgentShopResolver {
  constructor(private agentService: AgentService) {}

  @Query()
  async activeAgents(
    @Ctx() ctx: RequestContext,
    @Args() args: { options?: any }
  ) {
    const options = {
      ...args.options,
      isVerified: true, // Only show verified agents to customers
    };
    const agents = await this.agentService.findAll(ctx, options);
    return {
      items: agents,
      totalItems: agents.length,
    };
  }

  @Query()
  async agent(
    @Ctx() ctx: RequestContext,
    @Args() args: { id: string }
  ) {
    const agent = await this.agentService.findOne(ctx, args.id);
    // Only return if verified and active
    if (agent && agent.isVerified && agent.isActive) {
      return agent;
    }
    return null;
  }

  @Query()
  async agentsByCategory(
    @Ctx() ctx: RequestContext,
    @Args() args: { category: string }
  ) {
    return this.agentService.findAll(ctx, {
      category: args.category,
      isVerified: true,
    });
  }
}
