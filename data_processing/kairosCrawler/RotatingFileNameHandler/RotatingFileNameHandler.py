#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Created on 2018 Jun.
@author: HuangLiPang, QuenLo 
python version: 2.7
Desciption:
Rotating file handler will produce the log with its name the same with the 
execution file name.
"""

import logging
import datetime
import os
import sys

class RotatingFileNameHandler(logging.handlers.RotatingFileHandler):
    def __init__(self, filename, logPath, maxBytes=1024, backupCount=3):

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
        logPath = logPath + '/' + filename.split('/')[-1].replace(".py", ".log")

        # please set the maxBytes and backupCount by yourself
        # it will backup three files and delete the oldest one when create a new one
        # the latest log will always store in filename.log
        super(RotatingFileNameHandler, self).__init__(filename=logPath, maxBytes=maxBytes,\
                                                        backupCount=backupCount)
        super(RotatingFileNameHandler, self).setFormatter(fmt=formatter)

        # NOTSET, DEBUG, INFO, WARNING, ERROR, CRITICAL
        # logging levels doc
        # https://docs.python.org/2/howto/logging.html#logging-levels
        super(RotatingFileNameHandler, self).setLevel(logging.INFO)