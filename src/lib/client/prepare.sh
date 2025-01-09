#!/bin/bash
set -e

rm -rf ./types/
cp -r ../../common/types/ ./types/
cp ../../../LICENSE.md .