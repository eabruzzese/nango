import { LeftNavBarItems } from '../../components/LeftNavBar';
import DashboardLayout from '../../layout/DashboardLayout';
import { useStore } from '../../store';
import Info from '../../components/ui/Info';
import { Loading } from '@geist-ui/core';
import { useSearchOperations } from '../../hooks/useLogs';
import * as Table from '../../components/ui/Table';
import { getCoreRowModel, useReactTable, flexRender } from '@tanstack/react-table';

import { MultiSelect } from './components/MultiSelect';
import { columns, integrationsDefaultOptions, statusDefaultOptions, statusOptions, typesDefaultOptions, typesOptions } from './constants';
import { useEffect, useMemo, useState } from 'react';
import type { SearchOperationsIntegration, SearchOperationsState, SearchOperationsType } from '@nangohq/types';
import Spinner from '../../components/ui/Spinner';
import { OperationRow } from './components/OperationRow';
import { Input } from '../../components/ui/input/Input';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { formatQuantity } from '../../utils/utils';
import { useSearchParams } from 'react-router-dom';

export const LogsSearch: React.FC = () => {
    const env = useStore((state) => state.env);
    const [searchParams, setSearchParams] = useSearchParams();

    // Data fetch
    const [synced, setSynced] = useState(false);
    const [states, setStates] = useState<SearchOperationsState[]>(statusDefaultOptions);
    const [types, setTypes] = useState<SearchOperationsType[]>(typesDefaultOptions);
    const [integrations, setIntegrations] = useState<SearchOperationsIntegration[]>(integrationsDefaultOptions);
    const [hasLogs, setHasLogs] = useState<boolean>(false);
    const { data, error, loading } = useSearchOperations(synced, env, { limit: 20, states });

    const table = useReactTable({
        data: data ? data.data : [],
        columns,
        getCoreRowModel: getCoreRowModel()
    });

    useEffect(() => {
        if (synced) {
            return;
        }

        const tmpStates = searchParams.get('states');
        setStates(tmpStates ? (tmpStates.split(',') as any) : statusDefaultOptions);
        const tmpIntegrations = searchParams.get('integrations');
        setIntegrations(tmpIntegrations ? (tmpIntegrations.split(',') as any) : integrationsDefaultOptions);
        setSynced(true);
    }, [searchParams, synced]);

    useEffect(() => {
        setSearchParams(new URLSearchParams({ states: states as any, integrations: integrations as any }));
    }, [states]);

    useEffect(() => {
        if (!loading) {
            // We set this so it does not flicker when we go from a state of "filtered no records" to "default with records"...
            // ...to not redisplay the empty state
            setHasLogs(true);
        }
    }, [loading]);

    const total = useMemo(() => {
        if (!data?.pagination) {
            return 0;
        }
        return formatQuantity(data.pagination.total);
    }, [data?.pagination]);

    if (error) {
        return (
            <DashboardLayout selectedItem={LeftNavBarItems.Logs} marginBottom={60}>
                <Info color={error.error.code === 'feature_disabled' ? 'orange' : 'red'} classNames="text-xs" size={20}>
                    {error.error.code === 'feature_disabled'
                        ? 'This feature is disabled. Install OpenSearch and set "NANGO_LOGS_ENABLED" flag to `true`'
                        : 'An error occured, refresh your page or reach out to the support.'}
                </Info>
            </DashboardLayout>
        );
    }

    if ((loading && !data) || !data) {
        return (
            <DashboardLayout selectedItem={LeftNavBarItems.Logs} marginBottom={60}>
                <Loading spaceRatio={2.5} className="-top-36" />
            </DashboardLayout>
        );
    }

    if (data.pagination.total <= 0 && !hasLogs) {
        return (
            <DashboardLayout selectedItem={LeftNavBarItems.Logs} marginBottom={60}>
                <h2 className="text-3xl font-semibold text-white mb-4">Logs</h2>

                <div className="flex flex-col border border-zinc-500 rounded items-center text-white text-center py-24 gap-2">
                    <h2 className="text-xl">You don&apos;t have logs yet.</h2>
                    <div className="text-sm text-zinc-400">Note that logs older than 15 days are automatically cleared.</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout selectedItem={LeftNavBarItems.Logs} marginBottom={60}>
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-semibold text-white mb-4 flex gap-4 items-center">Logs {loading && <Spinner size={1} />}</h2>
                <div className="text-white text-xs">{total} logs found</div>
            </div>

            <div className="flex gap-2 justify-between">
                <div className="w-full">
                    <Input before={<MagnifyingGlassIcon className="w-5 h-5" />} placeholder="Search operations..." />
                </div>
                <MultiSelect label="Status" options={statusOptions} selected={states} defaultSelect={statusDefaultOptions} onChange={setStates} all />
                <MultiSelect label="Type" options={typesOptions} selected={types} defaultSelect={typesDefaultOptions} onChange={setTypes} />
                <MultiSelect label="Integration" options={typesOptions} selected={types} defaultSelect={typesDefaultOptions} onChange={setTypes} all />
            </div>

            <Table.Table className="my-6 table-fixed">
                <Table.Header>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <Table.Row key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <Table.Head
                                        key={header.id}
                                        style={{
                                            width: header.getSize()
                                        }}
                                    >
                                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                    </Table.Head>
                                );
                            })}
                        </Table.Row>
                    ))}
                </Table.Header>
                <Table.Body>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => <OperationRow key={row.id} row={row} />)
                    ) : (
                        <Table.Row>
                            <Table.Cell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </Table.Cell>
                        </Table.Row>
                    )}
                </Table.Body>
            </Table.Table>
        </DashboardLayout>
    );
};
