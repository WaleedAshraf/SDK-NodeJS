/* eslint-disable max-nested-callbacks */

import { assert, expect } from 'chai'
import nock from 'nock'
import path from 'path'

import * as recast from '../src'
import json from './resource/json'
import conversationJson from './resource/conversationJson'

const TOKEN = process.env.RECAST_TOKEN || 'FAKE_TOKEN'
const LANGUAGE = 'FR'

describe('Client class', () => {

  // Instanciation

  it('it should be instanciable without token', () => {
    expect(new recast.Client(null, LANGUAGE)).to.be.an.instanceof(recast.Client)
  })

  it('it should be instanciable without language', () => {
    expect(new recast.Client(TOKEN, null)).to.be.an.instanceof(recast.Client)
  })

  it('should be instanciable without params', () => {
    expect(new recast.Client()).to.be.an.instanceof(recast.Client)
  })

  it('should be instanciable with all params', () => {
    expect(new recast.Client(TOKEN, LANGUAGE)).to.be.an.instanceof(recast.Client)
  })

  // Attribute

  it('should have attributes', () => {
    const client = new recast.Client(TOKEN, LANGUAGE)

    assert.equal(client.token, TOKEN)
    assert.equal(client.language, LANGUAGE)

    assert.throws(() => { recast.Client() }, TypeError, 'Cannot call a class as a function')
  })

  // Methods

  const client = new recast.Client(TOKEN)

  describe('textRequest', () => {
    nock('https://api.recast.ai')
      .post('/v2/request')
      .once()
      .reply(200, json)

    nock('https://api.recast.ai')
      .post('/v2/request')
      .once()
      .reply(404, 'invalid parameter')

    it('should perform a text request', done => {
      client.textRequest('Hello world')
        .then(res => {
          assert.equal(res.status, 200)
          done()
        })
    })

    it('should fail if no token', (done) => {
      const clientWithoutToken = new recast.Client()
      clientWithoutToken.textRequest('text')
        .catch(err => {
          assert.equal(err, 'Token is missing')
          done()
        })
    })

    it('should return an error on 404', done => {
      client.textRequest('Hello world')
        .catch(() => {
          done()
        })
    })
  })

  describe('textConversation', () => {
    nock('https://api.recast.ai')
      .post('/v2/converse')
      .once()
      .reply(404, 'invalid parameter')

    it('should performs a converse request', done => {
      done()
    })

    it('should fail if no token', done => {
      done()
    })
  })

  describe('fileRequest', () => {
    nock('https://api.recast.ai')
      .post('/v2/request')
      .once()
      .reply(200, json)

    nock('https://api.recast.ai')
      .post('/v2/request')
      .once()
      .reply(404, 'invalid parameter')

    it('should perform a voice request', function (done) {
      this.timeout(15000)
      client.fileRequest(path.join(__dirname, '/resource/test.wav'))
        .then(res => {
          assert.equal(res.status, 200)
          done()
        })
    })

    it('should return an error on 404', done => {
      client.fileRequest('spec/resource/test.wav')
        .catch(() => {
          done()
        })
    })

    it('should throw an error on missing token', (done) => {
      const clientWithoutToken = new recast.Client()
      clientWithoutToken.fileRequest(path.resolve(__dirname, '/resource/test.wav'))
        .catch(err => {
          expect(err).to.be.an.instanceof(Error)
          assert.equal(err.message, 'Token is missing')
          done()
        })
    })
  })
})

describe('Response class', () => {

  it('should be instanciable', () => {
    expect(new recast.Response(json.results)).to.be.an.instanceof(recast.Response)
  })

  it('should have attributes', () => {
    const response = new recast.Response(json.results)

    assert.equal(response.uuid, json.results.uuid)
    assert.equal(response.source, json.results.source)
    assert.equal(response.act, json.results.act)
    assert.equal(response.type, json.results.type)
    expect(response.intents).to.be.an.instanceof(Array)
    assert.equal(response.sentiment, json.results.sentiment)
    expect(response.entities).to.be.an.instanceof(Array)
    expect(response.entities[0]).to.be.an.instanceof(recast.Entity)
    assert.equal(response.language, json.results.language)
    assert.equal(response.version, json.results.version)
    assert.equal(response.timestamp, json.results.timestamp)
    assert.equal(response.entities.length, 4)
  })

  it('should have methods', () => {
    const response = new recast.Response(json.results)

    assert.equal(response.intent(), response.intents[0])
    assert.equal(response.all('location').length, 2)
    assert.equal(response.get('location').name, 'location')

    assert.equal(response.isAssert(), false)
    assert.equal(response.isCommand(), false)
    assert.equal(response.isWhQuery(), true)
    assert.equal(response.isYnQuery(), false)
    assert.equal(response.isAbbreviation(), false)
    assert.equal(response.isEntity(), false)
    assert.equal(response.isDescription(), true)
    assert.equal(response.isHuman(), false)
    assert.equal(response.isLocation(), false)
    assert.equal(response.isNumber(), false)
    assert.equal(response.isVPositive(), false)
    assert.equal(response.isPositive(), false)
    assert.equal(response.isNeutral(), true)
    assert.equal(response.isNegative(), false)
    assert.equal(response.isVNegative(), false)

    assert.throws(() => { recast.Response() }, TypeError, 'Cannot call a class as a function')
  })
})

describe('Entity class', () => {
  const data1 = { person: 1, number: 'singular', gender: 'unkown', raw: 'me' }
  const data2 = { value: 'asparagus', raw: 'asparagus' }

  it('should be instanciable', () => {
    expect(new recast.Entity('ingredient', data2)).to.be.an.instanceof(recast.Entity)
  })

  it('should have attributes', () => {
    const testEntity1 = new recast.Entity('person', data1)
    const testEntity2 = new recast.Entity('ingredient', data2)

    // Test on first Entity
    assert.equal(testEntity1.name, 'person')
    assert.equal(testEntity1.person, data1.person)
    assert.equal(testEntity1.number, data1.number)
    assert.equal(testEntity1.gender, data1.gender)
    assert.equal(testEntity1.raw, data1.raw)

    // Test on second Entity
    assert.equal(testEntity2.name, 'ingredient')
    assert.equal(testEntity2.value, data2.value)
    assert.equal(testEntity2.raw, data2.raw)

    assert.throws(() => { recast.Entity() }, TypeError, 'Cannot call a class as a function')
  })
})

describe('RecastError', () => {
  it('should throw an error', () => {
    assert.throws(() => { recast.RecastError() }, TypeError, 'Cannot call a class as a function')
  })
})

describe('Conversation class', () => {
  it('should be instanciable', () => {
    expect(new recast.Conversation(conversationJson)).to.be.an.instanceof(recast.Conversation)
  })

  it('should have attributes', () => {
    const converse = new recast.Conversation(conversationJson.results)
    const results = conversationJson.results

    assert.equal(converse.uuid, results.uuid)
    assert.equal(converse.source, results.source)
    assert.equal(converse.replies, results.replies)
    assert.equal(converse.action, results.action)
    assert.equal(converse.nextActions, results.next_actions)
    assert.equal(converse.intents, results.intents)
    assert.equal(converse.conversationToken, results.conversation_token)
    assert.equal(converse.language, results.language)
    assert.equal(converse.timestamp, results.timestamp)
    assert.equal(converse.status, results.status)
  })

  it('should have methods', () => {
    const converse = new recast.Conversation(conversationJson.results)
    const results = conversationJson.results

    assert.equal(converse.reply(), results.replies[0])
    assert.equal(converse.nextAction(), results.next_actions[0])
    assert.equal(converse.joinedReplies(), results.replies.join(' '))
    assert.equal(converse.joinedReplies('\n'), results.replies.join('\n'))
    assert.equal(converse.getMemory(), results.memory)
    assert.equal(converse.getMemory('lieu'), results.memory.lieu)
  })

  it('should have statics methods', () => {
    expect(recast.Conversation).to.have.property('setMemory')
    expect(recast.Conversation).to.have.property('resetMemory')
    expect(recast.Conversation).to.have.property('resetConversation')
  })
})
