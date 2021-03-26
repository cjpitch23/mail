'use strict'

/*
 * adonis-mail
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

require('dotenv').config()
const test = require('japa')
const { mailgun: Mailgun } = require('../src/Mail/Drivers')
const Message = require('../src/Mail/Message')

test.group('Mailgun', () => {
  test('get list of receipent with email', (assert) => {
    const mailgun = new (Mailgun.Transport)()
    const message = new Message()

    message.to('foo@bar.com')
    const recipients = mailgun._getRecipients({ data: message.toJSON() })
    assert.deepEqual(recipients, 'foo@bar.com')
  })

  test('get list of receipent with email and name', (assert) => {
    const mailgun = new (Mailgun.Transport)()
    const message = new Message()

    message.to('foo@bar.com', 'Mr foo')
    const recipients = mailgun._getRecipients({ data: message.toJSON() })
    assert.deepEqual(recipients, 'Mr foo <foo@bar.com>')
  })

  test('get list of receipent including cc', (assert) => {
    const mailgun = new (Mailgun.Transport)()
    const message = new Message()

    message.to('foo@bar.com', 'Mr foo')
    message.cc('baz@bar.com', 'Mr baz')
    const recipients = mailgun._getRecipients({ data: message.toJSON() })
    assert.deepEqual(recipients, 'Mr foo <foo@bar.com>,Mr baz <baz@bar.com>')
  })

  test('get list of receipent including bcc', (assert) => {
    const mailgun = new (Mailgun.Transport)()
    const message = new Message()

    message.to('foo@bar.com', 'Mr foo')
    message.bcc('baz@bar.com', 'Mr baz')
    const recipients = mailgun._getRecipients({ data: message.toJSON() })
    assert.deepEqual(recipients, 'Mr foo <foo@bar.com>,Mr baz <baz@bar.com>')
  })

  test('return empty object when no extras are defined', (assert) => {
    const mailgun = new (Mailgun.Transport)({})
    assert.deepEqual(mailgun._getExtras(), {})
  })

  test('return config from the static config', (assert) => {
    const mailgun = new (Mailgun.Transport)({
      extras: {
        'o:campaign': 'marketing'
      }
    })
    assert.deepEqual(mailgun._getExtras(), { 'o:campaign': 'marketing' })
  })

  test('give priority to runtime config', (assert) => {
    const mailgun = new (Mailgun.Transport)({
      extras: {
        'o:campaign': 'marketing'
      }
    })
    assert.deepEqual(mailgun._getExtras({ 'o:campaign': 'sales' }), { 'o:campaign': 'sales' })
  })

  test('return correct endpoint when region is not set', (assert) => {
    const mailgun = new (Mailgun.Transport)({
      domain: 'test.domain'
    })
    assert.deepEqual(mailgun.endpoint, 'https://api.mailgun.net/v3/test.domain/messages.mime')
  })

  test('return correct endpoint when region is set', (assert) => {
    const mailgun = new (Mailgun.Transport)({
      domain: 'test.domain',
      region: 'EU'
    })
    assert.deepEqual(mailgun.endpoint, 'https://api.eu.mailgun.net/v3/test.domain/messages.mime')
  })

  test('send plain email', async (assert) => {
    const config = {
      domain: process.env.MAILGUN_DOMAIN,
      apiKey: process.env.MAILGUN_API_KEY
    }

    const mailgun = new Mailgun()
    mailgun.setConfig(config)

    const response = await mailgun.send({
      from: [process.env.SMTP_FROM_EMAIL],
      to: [{ name: 'virk', address: process.env.SMTP_TO_EMAIL }],
      subject: 'Mailgun email',
      html: '<h2> Hello </h2>'
    })

    assert.isDefined(response.messageId)
    assert.equal(response.acceptedCount, 1)
  }).timeout(0)

  test('return mail error', async (assert) => {
    assert.plan(1)

    const config = {
      domain: process.env.MAILGUN_DOMAIN,
      apiKey: null
    }

    const mailgun = new Mailgun()
    mailgun.setConfig(config)

    try {
      await mailgun.send({
        from: [process.env.SMTP_TO_EMAIL],
        to: [{ name: 'virk', address: process.env.SMTP_TO_EMAIL }],
        subject: 'Mailgun email',
        html: '<h2> Hello </h2>'
      })
    } catch (error) {
      assert.match(error.message, /Response code 401/)
    }
  }).timeout(0)
})
