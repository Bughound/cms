'use strict';

const axios = require('axios')
const turf = require('@turf/turf')
const OpenWeather = require('../../../config/openweather')
const TensorFlow = require('../../../config/tensorflow')
const fs = require('fs')
const FormData = require('form-data');
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
const filterGeoreferenceParams = ['lat', 'long', 'distance']

/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

const searchZones = async (coordinates, zoneType) => (await strapi.services.zone.find({ type: zoneType })).filter(zone => {
  const from = turf.point(coordinates)
  const to = turf.point(zone.geojson.geometry.coordinates)
  const distance = turf.distance(from, to)

  return distance < zone.distance
})

const getImportance = (taxon) => {
  if(taxon.sanitary > 0) {
    return 'sanitary'
  } else if (taxon.economic > 0) {
    return 'economic'
  }
}

const createAlert = async (zones, observationId) => await Promise.all(zones.map(async (zone) => await strapi.services.alert.create({
    zone: zone.id,
    observation: observationId
  })
))

module.exports = {

  async create(ctx) {
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      const formData = new FormData()
      const coordinates = data.geojson.features[0].geometry.coordinates
      
      formData.append('images', fs.createReadStream(files.image.path))

      const tensorflowResponse = await axios.post(`${TensorFlow.protocol}://${TensorFlow.host}:${TensorFlow.port}/detections`, formData, { headers: { ...formData.getHeaders(), } });
      const detections = tensorflowResponse.data.response[0].detections
      const promises = detections.map(async item => {
        const taxonNames = item.class.split(' ')
        const response = await strapi.query('taxon').findOne({ name: taxonNames[1], 'parent.name': taxonNames[0] })
        return {
          taxon: response,
          label: item.class,
          confidence: item.confidence
        }
      })

      const predictions = await Promise.all(promises)
      predictions.sort((a ,b) => b['confidence'] - a['confidence'])

      const selectedTaxon = predictions[0].taxon

      if(selectedTaxon) {
        data.taxon = selectedTaxon.id
      }

      const OpenWeatherResponse = await axios.get(`${OpenWeather.protocol}://${OpenWeather.host}${OpenWeather.path}`, { 
        params: {
          lat: coordinates[1],
          lon: coordinates[0],
          lang: 'es',
          units: 'metric',
          appid: OpenWeather.apiKey
        }
      })
      
      data.weather = OpenWeatherResponse.data
      data.created_by = ctx.state.user.id

      entity = await strapi.services.observation.create(data, { files });
      entity.predictions = predictions
      await createAlert((await searchZones(coordinates, getImportance(selectedTaxon))), entity.id)
    } else {
      entity = await strapi.services.observation.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.observation });
  },

  async find(ctx) {
    const georeferenceParams = Object.assign({}, ...filterGeoreferenceParams.map(param => { 
      const obj = Object.assign({}, { [param]: ctx.query[param] })
      delete ctx.query[param]
      return obj
    }))

    let entities;

    if (ctx.query._q) {
      entities = await strapi.services.observation.search(ctx.query)
    } else {
      entities = await strapi.services.observation.find(ctx.query)
    }
    const parentIds = entities.map(e => e.taxon.parent).filter(taxon => taxon)
    const parentEntity = await strapi.services.taxon.find({ id_in: parentIds })

    if(georeferenceParams.lat && georeferenceParams.long && georeferenceParams.distance) {
      let distance
      entities = entities.filter(entity => { 
        try {
          let from = turf.point(entity.geojson.features[0].geometry.coordinates)
          let to = turf.point([georeferenceParams.long, georeferenceParams.lat])

          distance = turf.distance(from, to)
          return distance <= georeferenceParams.distance
        } catch (error) {
          return false
        }
      })
    }

    return entities.map(entity => {
      entity.taxon.parent = entity.taxon.parent ? (parentEntity.find(parent => parent.id === entity.taxon.parent) || null) : entity.taxon.parent
      return sanitizeEntity(entity, { model: strapi.models.observation })
    })
  },
};
