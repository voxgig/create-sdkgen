#!/usr/bin/env python3

# -*- encoding: utf-8 -*-

import io
from glob import glob
from os.path import basename
from os.path import dirname
from os.path import join
from os.path import splitext

from setuptools import find_packages
from setuptools import setup


'''
classifiers=[
  # complete classifier list: http://pypi.python.org/pypi?%3Aaction=list_classifiers
  'Development Status :: 5 - Production/Stable',
  'Intended Audience :: Developers',
  'License :: OSI Approved :: BSD License',
  'Operating System :: Unix',
  'Operating System :: POSIX',
  'Operating System :: Microsoft :: Windows',
  'Programming Language :: Python',
  'Programming Language :: Python :: 2.7',
  'Programming Language :: Python :: 3',
  'Programming Language :: Python :: 3.5',
  'Programming Language :: Python :: 3.6',
  'Programming Language :: Python :: 3.7',
  'Programming Language :: Python :: 3.8',
  'Programming Language :: Python :: 3.9',
  'Programming Language :: Python :: Implementation :: CPython',
  'Programming Language :: Python :: Implementation :: PyPy',
  # uncomment if you test on these interpreters:
  # 'Programming Language :: Python :: Implementation :: IronPython',
  # 'Programming Language :: Python :: Implementation :: Jython',
  # 'Programming Language :: Python :: Implementation :: Stackless',
  'Topic :: Utilities',
],
'''

def read(*names, **kwargs):
    with io.open(
        join(dirname(__file__), *names),
        encoding=kwargs.get('encoding', 'utf8')
    ) as fh:
        return fh.read()

def read_version(fname="src/plantquest_sdk/version.py"):
    exec(compile(open(fname, encoding="utf-8").read(), fname, "exec"))
    return locals()["__version__"]

setup(
    name='plantquest_sdk',
    version='0.0.1',
    license='MIT',
    description='An example SDK.',
    long_description='Long description of SDK',
    author='PlantQuest Ltd',
    url='https://github.com/plantquest',
    packages=find_packages('src'),
    package_dir={'': 'src'},
    # py_modules=['plantquest_sdk/example'],

    # py_modules=[splitext(basename(path))[0] for path in glob('src/plantquest_sdk/*.py')],
    include_package_data=True,
    # data_files=[('bitmaps', ['bm/b1.gif', 'bm/b2.gif']), ('config', ['cfg/data.cfg'])],
    zip_safe=False,
    keywords=[
    ],
    python_requires='>=3.0',
    install_requires=[
        'python-dotenv>=1.0.1',
        'pydantic>=2.8.0'
    ],
    extras_require={"dev": [ "pytest" ]},
    setup_requires=[
        'pytest-runner',
    ],
    tests_require=['pytest']
)
