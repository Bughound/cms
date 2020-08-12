
'use strict';

/**
 * A set of functions called "actions" for `User`
 */

const { sanitizeEntity } = require('strapi-utils');

const sanitizeUser = user =>
  sanitizeEntity(user, {
    model: strapi.query('user', 'users-permissions').model,
  });

module.exports = {
  async me(ctx) {
    const user = ctx.state.user;

    if (!user) {
      return ctx.badRequest(null, [{ messages: [{ id: 'No authorization header was found' }] }]);
    }

    const data = sanitizeUser(await strapi.query('user', 'users-permissions').findOne({ id: user.id }));
    ctx.send(data);
  }
};