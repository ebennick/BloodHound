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

import userEvent from '@testing-library/user-event';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, waitForElementToBeRemoved } from '../../../test-utils';
import { mockCodemirrorLayoutMethods } from '../../../utils';
import CypherSearch from './CypherSearch';

const CYPHER = 'match (n) return n limit 5';

describe('CypherSearch', () => {
    const setup = async () => {
        const state = {
            cypherQuery: '',
            setCypherQuery: vi.fn(),
            performSearch: vi.fn(),
        };

        const screen = await render(<CypherSearch cypherSearchState={state} />);
        const user = await userEvent.setup();

        return { state, screen, user };
    };

    const server = setupServer(
        rest.get('/api/v2/graphs/kinds', async (_req, res, ctx) => {
            return res(
                ctx.json({
                    data: { kinds: ['Tier Zero', 'Tier One', 'Tier Two'] },
                })
            );
        }),
        rest.get('/api/v2/features', async (req, res, ctx) => {
            return res(
                ctx.json({
                    data: [{ id: 1, key: 'tier_management_engine', enabled: true }],
                })
            );
        })
    );

    beforeAll(() => {
        server.listen();
    });
    beforeEach(mockCodemirrorLayoutMethods);
    afterEach(vi.restoreAllMocks);
    afterAll(() => {
        server.close();
    });

    it('should render', async () => {
        const { screen } = await setup();
        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
        expect(screen.getByText(/cypher query/i)).toBeInTheDocument();

        expect(screen.getByRole('link', { name: /help/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /run/ })).toBeInTheDocument();
    });

    // Disabling this test for now, tailwind does not output any css in shared-ui tests so we can't check for visibility
    it.skip('should show common cypher searches when user clicks on folder button', async () => {
        const { screen, user } = await setup();
        const prebuiltSearches = screen.getByText(/pre-built searches/i);
        expect(prebuiltSearches).not.toBeVisible();

        const menu = screen.getByRole('button', { name: /show\/hide saved queries/i });

        await user.click(menu);
        expect(prebuiltSearches).toBeVisible();
    });

    it('should call the setCypherQuery handler when the value in the editor changes', async () => {
        const { screen, user, state } = await setup();
        const searchbox = screen.getAllByRole('textbox');

        await user.type(searchbox[0], CYPHER);
        expect(state.setCypherQuery).toHaveBeenCalledTimes(CYPHER.length);
    });

    it('should call performSearch when a value is in the searchbox and the "Run" button is clicked', async () => {
        const { screen, user, state } = await setup();
        await waitForElementToBeRemoved(() => screen.queryByText('Loading...'));
        const searchbox = screen.getAllByRole('textbox');
        const run = screen.getByRole('button', { name: /run/ });

        await user.type(searchbox[0], CYPHER);
        await user.click(run);

        expect(state.performSearch).toHaveBeenCalledTimes(1);
    });
});
