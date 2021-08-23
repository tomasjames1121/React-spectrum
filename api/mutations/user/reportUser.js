// @flow
import { isAuthedResolver } from '../../utils/permissions';
import UserError from '../../utils/UserError';
import type { GraphQLContext } from '../../';

type ReportUserInput = {
  input: {
    userId: string,
    reason: string,
  },
};

export default isAuthedResolver(
  async (_: any, args: ReportUserInput, ctx: GraphQLContext) => {
    const {
      input: { userId },
    } = args;
    const { loaders, user: currentUser } = ctx;

    if (currentUser.id === userId) {
      return new UserError('You cannot report yourself.');
    }

    const reportedUser = await loaders.user.load(userId);

    if (!reportedUser) {
      return new UserError(`User with ID ${userId} does not exist.`);
    }

    return true;
  }
);
