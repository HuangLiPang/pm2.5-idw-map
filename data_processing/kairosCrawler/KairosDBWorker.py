#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
  Created on 2019 Jan.
  @author: HuangLiPang

  python version: 2.7

  Kairos Rest API doc:
  http://kairosdb.github.io/docs/build/html/restapi/index.html

  Description:
    A class for KairosDB query.
"""

import requests
import json

class KairosDBWorker:
  midUrl = "/api/v1/datapoints"
  header = {"Content-type": "application/json"}
  def __init__(self, url, user, password):
    self.url = url
    self.user = user
    self.password = password

  def queryWithPost(self, target, option):
    response = requests.post(self.url + self.midUrl + target, \
      headers=self.header, \
      data=json.dumps(option), \
      auth=(self.user, self.password))
    if response.status_code == 200:
      return response.json()
    else:
      return None