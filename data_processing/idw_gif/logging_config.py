import logging
import datetime
import time
import config

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
                      " - %(levelname)s - %(filename)s - %(message)s",
            "datefmt": "%Y-%m-%d %I:%M:%S %p"
        },
        "utc": {
            "()": UTCFormatter,
            "format": "%(asctime)s %(message)s",
            "datefmt": "%Y-%m-%d %I:%M:%S %p"
        }
    },
    "handlers": { 
        "file": { 
            "level": "INFO",
            "formatter": "complete",
            "class": "logging.FileHandler",
            "filename": config.DIR + "data_processing/idw_gif/log/" + datetime.datetime.now().strftime("%Y-%m-%d.log"),
        }
    },
    "root": {
        "handlers": ["file"],
        "level": "INFO",
        "propagate": True
    }
}