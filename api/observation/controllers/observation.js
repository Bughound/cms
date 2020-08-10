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
      detections.sort((a ,b) => b['confidence'] - a['confidence'])
      const taxonNames = detections[0].class.split(' ')
      const result = await strapi.query('taxon').findOne({ name: taxonNames[1], 'parent.name': taxonNames[0] })
      if(result) {
        data.taxon = result.id
      }
      entity = await strapi.services.observation.create(data, { files });
      entity.prediction = {
        taxon: result,
        label: detections[0].class,
        confidence: detections[0].confidence
      }
    } else {
      entity = await strapi.services.observation.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.observation });
  }
};
