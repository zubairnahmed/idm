/* eslint-disable no-undef */

import passport from 'passport'
import fetch from 'node-fetch'

import React from 'react'
import ReactDOMServer from 'react-dom/server'

import {
  findByEmailAndUpdateOrCreate as findByEmailAndUpdateOrCreateUser
} from '../dao/Users'
import { renderFullPage } from '../render'

import Root from '../../common/containers/Root'


export function updateUser(accessToken, refreshToken, profile, done) {
  const userData = {
    name: profile.displayName,
    email: profile.emails[0].value,
    google_auth_info: {
      accessToken: accessToken,
      refreshToken: refreshToken,
      profile: profile,
    },
  }
  findByEmailAndUpdateOrCreateUser(userData.email, userData)
    .then((user) => done(null, user))
    .catch((err) => done({ code: err.code || 401, message: err.toString() }))
}

export function authenticate(req, res, next) {
  const scopes = [
    'profile',
    'email',
    'https://www.googleapis.com/auth/calendar',
  ]

  passport.authenticate('google', { scope: scopes, accessType: 'offline'})(req, res, next)
}

// TODO: any way to refactor this with what's in ../render.js?
export function callback(req, res, next) {
  passport.authenticate(
    'google', {},
    (err, user) => {
      if (err) {
        return res.status(401).send(`<html><body><h1>401 Unauthorized</h1><br/><p>${err.toString()}</p></body></html>`)
      }
      const initialState = { user }
      const renderedAppHtml = ReactDOMServer.renderToString(
        <Root />
      )
      fetch(process.env.ICONS_SERVICE_TAGS_API_URL)
        .then((resp) => {
          return resp.json()
        }).then((tags) => {
          res.send(renderFullPage(tags.join('\n        '), renderedAppHtml, initialState))
        })
    }
  )(req, res, next)
}