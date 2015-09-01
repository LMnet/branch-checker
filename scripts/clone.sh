#!/usr/bin/env bash
set -e

BRANCH_DIR=$1
REPO_URL=$2

cd $BRANCH_DIR

git clone $REPO_URL
