// Copyright 2024 Specter Ops, Inc.
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
import { Permission, createAuthStateWithPermissions } from 'bh-shared-ui';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { render, screen, waitFor } from 'src/test-utils';
import DatabaseManagement from '.';

describe('DatabaseManagement', () => {
    const server = setupServer(
        rest.get('/api/v2/self', (req, res, ctx) => {
            return res(
                ctx.json({
                    data: createAuthStateWithPermissions([Permission.WIPE_DB]).user,
                })
            );
        }),
        rest.post('/api/v2/clear-database', (req, res, ctx) => {
            return res(ctx.status(204));
        }),
        rest.get('/api/v2/features', async (req, res, ctx) => {
            return res(
                ctx.json({
                    data: [
                        {
                            id: 1,
                            key: 'clear_graph_data',
                            name: 'Clear Graph Data',
                            description: 'Enables the ability to delete all nodes and edges from the graph database.',
                            enabled: true,
                            user_updatable: true,
                        },
                    ],
                })
            );
        })
    );

    beforeAll(() => server.listen());
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    it('renders', async () => {
        render(<DatabaseManagement />);

        const title = screen.getByText(/Database Management/i);
        const button = screen.getByRole('button', { name: /proceed/i });

        expect(title).toBeInTheDocument();
        expect(await screen.findByRole('checkbox', { name: /Collected graph data/i })).toBeInTheDocument();

        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes.length).toEqual(5);
        expect(button).toBeInTheDocument();
    });

    it('disables the proceed button and all checkboxes if the user lacks permission', async () => {
        render(<DatabaseManagement />);

        const checkboxes = await screen.getAllByRole('checkbox');

        checkboxes.forEach((checkbox) => {
            expect(checkbox).toBeDisabled();
        });

        const proceedButton = screen.getByRole('button', { name: 'Proceed' });

        expect(proceedButton).toBeDisabled();
    });

    it('displays error if proceed button is clicked when no checkbox is selected', async () => {
        render(<DatabaseManagement />);

        const user = userEvent.setup();

        const button = screen.getByRole('button', { name: /proceed/i });
        await waitFor(() => expect(button).not.toBeDisabled());
        await user.click(button);

        const errorMsg = screen.getByText(/please make a selection/i);
        expect(errorMsg).toBeInTheDocument();
    });

    it('clicking checkbox will remove error if present', async () => {
        render(<DatabaseManagement />);

        const user = userEvent.setup();

        const button = screen.getByRole('button', { name: /proceed/i });
        await waitFor(() => expect(button).not.toBeDisabled());
        await user.click(button);

        const errorMsg = await screen.findByText(/please make a selection/i);
        expect(errorMsg).toBeInTheDocument();

        const checkbox = screen.getByRole('checkbox', { name: /All asset group selectors/i });
        await user.click(checkbox);

        expect(errorMsg).not.toBeInTheDocument();
    });

    it('open and closes dialog', async () => {
        render(<DatabaseManagement />);

        const user = userEvent.setup();

        const checkbox = screen.getByRole('checkbox', { name: /All asset group selectors/i });
        await waitFor(() => expect(checkbox).not.toBeDisabled());
        await user.click(checkbox);

        const button = screen.getByRole('button', { name: /proceed/i });
        await user.click(button);

        const dialog = screen.getByRole('dialog', { name: /confirm deleting data/i });
        expect(dialog).toBeInTheDocument();

        const closeButton = screen.getByRole('button', { name: /cancel/i });
        await user.click(closeButton);

        expect(dialog).not.toBeInTheDocument();
    });

    it('handles posting a mutation', async () => {
        render(<DatabaseManagement />);

        const user = userEvent.setup();

        const checkbox = screen.getByRole('checkbox', { name: /All asset group selectors/i });
        await waitFor(() => expect(checkbox).not.toBeDisabled());
        await user.click(checkbox);

        const proceedButton = screen.getByRole('button', { name: /proceed/i });
        await user.click(proceedButton);

        const textField = screen.getByRole('textbox');
        await user.type(textField, 'Please delete my data');

        const confirmButton = screen.getByRole('button', { name: /confirm/i });
        await user.click(confirmButton);

        const successMessage = screen.getByText(
            /Deletion of the data is under way. Depending on data volume, this may take some time to complete./i
        );
        expect(successMessage).toBeInTheDocument();
    });
});
