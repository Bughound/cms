'use strict';

const { sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {
  async statistics(ctx) {
    const hoursCount = new Array(24).fill(0)
    let years = {}
    const observations = await strapi.query('observation').find({ 'taxon.id': ctx.params.id });
    const weather = observations.filter(obs => obs.weather != null).map(obs => obs.weather);
    
    observations.forEach(observation => { 
      const date = new Date(observation.date)
      const observationYear = date.getFullYear()
      const observationHour = date.getHours()

      if(!years[observationYear]) {
        years[observationYear] = new Array(12).fill(0);
      }
      years[observationYear][date.getMonth()]++
      hoursCount[observationHour]++
    })

    const data =  {
      date_count: years,
      time: {
        hours_count: hoursCount,
        max: hoursCount.indexOf(Math.max(...hoursCount)),
        min: hoursCount.indexOf(Math.min.apply(null, hoursCount.filter(Boolean)))
      },
      temp: {
        min: Math.min(...weather.map(w => w.main.temp)),
        max: Math.max(...weather.map(w => w.main.temp))
      }
    }
    ctx.send(data)
  }
};
