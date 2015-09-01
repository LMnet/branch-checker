#!/usr/bin/env bash
set -e

BRANCH_DIR=$1
REPO_URL=$2
BRANCH_NAME=$3

cd $BRANCH_DIR

git clone -q $REPO_URL repo
cd repo
git checkout -q $BRANCH_NAME


COMMIT_NUMBER=`git log --oneline master..HEAD | wc -l`

if [ ${COMMIT_NUMBER} -eq 1 ]; then
    echo "Branch '$BRANCH_NAME' has exactly one commit"
else
    echo "Branch '$BRANCH_NAME' has more than one commit" >&2
    exit 1
fi


NEW_MASTER_COMMITS=`git log --oneline HEAD..master | wc -l`

if [ ${NEW_MASTER_COMMITS} -eq 0 ]; then
    echo "Branch '$BRANCH_NAME' is rebased from master"
else
    echo "Branch '$BRANCH_NAME' is not rebased from master" >&2
    exit 1
fi
