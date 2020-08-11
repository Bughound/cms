'use strict';

const axios = require('axios')
const fs = require('fs')
const FormData = require('form-data');
const { parseMultipartData, sanitizeEntity } = require('strapi-utils');
const tensorflow = {
  protocol: 'http',
  host: '192.168.0.210',
  port: 5000
}
/**
 * Read the documentation (https://strapi.io/documentation/v3.x/concepts/controllers.html#core-controllers)
 * to customize this controller
 */

module.exports = {

  async create(ctx) {
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      const formData = new FormData()
      formData.append('images', fs.createReadStream(files.image.path))

      const tensorflowResponse = await axios.post('http://localhost:5000/detections', formData, { headers: { ...formData.getHeaders(), } });
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

      if(predictions[0].taxon) {
        data.taxon = predictions[0].taxon.id
      }

      entity = await strapi.services.observation.create(data, { files });
      entity.predictions = predictions
    } else {
      entity = await strapi.services.observation.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.observation });
  }
};
