#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Created on 2018 Jun.
@author: HuangLiPang, QuenLo 
logging config doc:
https://docs.python.org/2/library/logging.config.html
"""
import logging
import datetime
import time
import os
import sys

class UTCFormatter(logging.Formatter):
  converter = time.gmtime


class RotatingFileNameHandler(logging.handlers.RotatingFileHandler):
  # filename and logPath must use absolute path
  def __init__(self, filename, logPath):

    # set formatter to format type
    # LogRecord attributes doc
    # https://docs.python.org/2/library/logging.html#logrecord-attributes
    formatter = logging.Formatter(fmt="%(asctime)s - PID: %(process)d"\
                    " - %(levelname)s - %(filename)s - %(message)s",\
                    datefmt="%Y-%m-%d %I:%M:%S %p")
    # check if log path exists
    if not os.path.isdir(logPath):
      try:
        os.mkdir(logPath)
        # only show on console
        logging.info("create directory %s" % logPath)
      except Exception as err:
        # only show on console
        logging.error(err)
        sys.exit(0)
    # set filename by the name of scripts
    logPath = logPath + "/" + filename.split('/')[-1].replace(".py", '') + ".log"

    # please set the maxBytes and backupCount by yourself
    # it will backup three files and delete the oldest one when create a new one
    # the latest log will always store in filename.log
    super(RotatingFileNameHandler, self).__init__(filename=logPath, maxBytes=1024, backupCount=3)
    super(RotatingFileNameHandler, self).setFormatter(fmt=formatter)

    # NOTSET, DEBUG, INFO, WARNING, ERROR, CRITICAL
    # logging levels doc
    # https://docs.python.org/2/howto/logging.html#logging-levels
    super(RotatingFileNameHandler, self).setLevel(logging.INFO)

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
            " - %(levelname)s - %(filename)s - %(message)s",
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
