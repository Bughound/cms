'use strict';

const { sanitizeEntity } = require('strapi-utils');
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async find(ctx) {
    let entities;

    if (ctx.query._q) {
      entities = await strapi.services.alert.search(ctx.query)
    } else {
      entities = await strapi.services.alert.find(ctx.query)
    }

    const taxonIds = entities.map(e => e.observation.taxon).filter(id => id)
    console.log(taxonIds)
    const taxonEntity = await strapi.services.taxon.find({ id_in: taxonIds })

    return entities.map(entity => {
      entity.observation.taxon = entity.observation.taxon ? (taxonEntity.find(taxon => taxon.id === entity.observation.taxon) || null) : entity.observation.taxon
      return sanitizeEntity(entity, { model: strapi.models.alert })
    })
  },
};
