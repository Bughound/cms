'use strict';

const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async statistics(ctx) {
    const months = new Array(12).fill(0);
    let years = {}
    const observations = await strapi.query('observation').find({ 'taxon.id': ctx.params.id });
    const weather = observations.filter(obs => obs.weather != null).map(obs => obs.weather);
    
    observations.forEach(observation => { 
      const date = new Date(observation.date)
      const observationYear = date.getFullYear()

      if(!years[observationYear]) {
        years[observationYear] = new Array(12).fill(0);
      }
      years[observationYear][date.getMonth()]++
    })

    const data =  {
      date_count: years,
      temp: {
        min: Math.min(...weather.map(w => w.main.temp)),
        max: Math.max(...weather.map(w => w.main.temp))
      }
    }
    ctx.send(data)
  }
};
