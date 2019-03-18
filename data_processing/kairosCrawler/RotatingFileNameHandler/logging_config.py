#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Created on 2018 Jun.
@author: HuangLiPang, QuenLo 
python version: 2.7
logging config doc:
https://docs.python.org/2/library/logging.config.html
"""
import logging
import logging.config
import time
from RotatingFileNameHandler import RotatingFileNameHandler

class UTCFormatter(logging.Formatter):
  converter = time.gmtime

LOGGING = {
  "version": 1,
  "disable_existing_loggers": False,
  "formatters": {
    # local time
    "standard": { 
      "format": "%(asctime)s - %(message)s",
      "datefmt": "%Y-%m-%d %I:%M:%S %p"
    },
    "complete": {
      "format": "%(asctime)s - PID: %(process)d"\
            " - %(levelname)s - %(filename)s - %(lineno)d - %(message)s",
      "datefmt": "%Y-%m-%d %I:%M:%S %p"
    },
    "utc": {
      # "()" is a special key, which indicates a custom instantiation.
      "()": UTCFormatter,
      "format": "%(asctime)s %(message)s",
      "datefmt": "%Y-%m-%d %I:%M:%S %p"
    }
  },
  "handlers": {
    # StreamHandler will show log in console
    "default": { 
      "level": "INFO",
      "formatter": "complete",
      "class": "logging.StreamHandler"
    }
  },
  # root logger
  "root": {
    "handlers": ["default"],
    # default level is "WARNING"
    "level": "INFO",
    "propagate": True
  }
}