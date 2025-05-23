// Copyright 2023 Specter Ops, Inc.
//
// Licensed under the Apache License, Version 2.0
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// SPDX-License-Identifier: Apache-2.0

import { createSelector } from '@reduxjs/toolkit';
import { produce } from 'immer';
import { AppState } from 'src/store';
import * as actions from './actions';
import * as types from './types';

const INITIAL_STATE: types.AssetGroupsState = {
    assetGroups: [],
    assetGroupDetails: {},
    loading: false,
    error: null,
};

const asssetGroupReducer = (state: types.AssetGroupsState = INITIAL_STATE, action: types.AssetGroupsActionTypes) => {
    return produce(state, (draft) => {
        switch (action.type) {
            case actions.LIST_ASSET_GROUPS:
                draft.loading = true;
                draft.error = null;
                break;

            case actions.LIST_ASSET_GROUPS_SUCCESS:
                draft.assetGroups = action.assetGroups;
                draft.loading = false;
                draft.error = null;
                break;

            case actions.LIST_ASSET_GROUPS_FAILURE:
                draft.loading = false;
                draft.error = action.error;
                break;

            case actions.GET_ASSET_GROUP:
                draft.loading = true;
                draft.error = null;
                break;

            case actions.GET_ASSET_GROUP_SUCCESS:
                draft.assetGroupDetails[action.assetGroupId] = action.assetGroupDetail;
                draft.loading = false;
                draft.error = null;
                break;

            case actions.GET_ASSET_GROUP_FAILURE:
                draft.loading = false;
                draft.error = action.error;
                break;
        }
    });
};

export const selectTierZeroAssetGroupId = (state: AppState): number => {
    return state.assetgroups.assetGroups.find((assetGroup) => assetGroup.tag === 'admin_tier_0')?.id;
};

export const selectOwnedAssetGroupId = (state: AppState): number => {
    return state.assetgroups.assetGroups.find((assetGroup) => assetGroup.tag === 'owned')?.id;
};

// use `createSelector` to memoize this selector because it returns an array which is
// always different from the previous render because === on reference types will be false
const selectAssetGroups = (state: AppState) => state.assetgroups.assetGroups;
export const selectAllAssetGroupIds = createSelector([selectAssetGroups], (assetGroups) => {
    return assetGroups.map((assetGroup) => assetGroup.id);
});

export default asssetGroupReducer;
