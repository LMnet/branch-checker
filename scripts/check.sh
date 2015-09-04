#!/usr/bin/env bash
set -e

BRANCH_DIR=$1
REPO_URL=$2
BRANCH_NAME=$3
BASE_BRANCH_NAME=$4

cd $BRANCH_DIR

git clone -q $REPO_URL repo
cd repo
git checkout -q $BASE_BRANCH_NAME
git checkout -q $BRANCH_NAME

COMMIT_NUMBER=`git log --oneline $BASE_BRANCH_NAME..$BRANCH_NAME | wc -l`

if [ $COMMIT_NUMBER -eq 1 ]; then
    echo "Branch '$BRANCH_NAME' has exactly one commit"
else
    echo "Branch '$BRANCH_NAME' has more than one commit" >&2
    exit 1
fi


NEW_BASE_BRANCH_COMMITS=`git log --oneline $BRANCH_NAME..$BASE_BRANCH_NAME | wc -l`

if [ $NEW_BASE_BRANCH_COMMITS -eq 0 ]; then
    echo "Branch '$BRANCH_NAME' is synchronized with base branch '$BASE_BRANCH_NAME'"
else
    echo "Branch '$BRANCH_NAME' isn't synchronized with base branch '$BASE_BRANCH_NAME'" >&2
    exit 1
fi


NEW_MASTER_COMMITS=`git log --oneline $BASE_BRANCH_NAME..master | wc -l`

if [ $NEW_MASTER_COMMITS -eq 0 ]; then
    echo "Base branch '$BASE_BRANCH_NAME' is synchronized with master"
else
    echo "Base branch '$BASE_BRANCH_NAME' isn't synchronized with master" >&2
    exit 1
fi
