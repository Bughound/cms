'use strict';

const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async statistics(ctx) {
    const months = new Array(12).fill(0);
    const observations = await strapi.query('observation').find({ 'taxon.id': ctx.params.id });
    const weather = observations.filter(obs => obs.weather != null).map(obs => obs.weather);
    
    observations.forEach(observation => { months[(new Date(observation.date)).getMonth()]++ })

    const data =  {
      date_count: months,
      temp: {
        min: Math.min(...weather.map(w => w.main.temp)),
        max: Math.max(...weather.map(w => w.main.temp))
      }
    }
    ctx.send(data)
  }
};
