import DataTable from '../../../components/Table/DataTable';

const TransactionHistory = ({ transactions, onTransactionSelect }) => {

    const columns = [
        {
            key: 'id',
            label: 'ID',
            render: (row) => `#${row.id}`
        },
        {
            key: 'type',
            label: 'Type',
            render: (row) => (
                <span className={`datatable-badge datatable-badge-${row.type}`}>{row.type}</span>
            )
        },
        {
            key: 'createdAt',
            label: 'Date',
            getValue: (row) => new Date(row.createdAt).getTime(),
            render: (row) => new Date(row.createdAt).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
        },
        {
            key: 'amount',
            label: 'Points',
            render: (row) => {
                const points = row.amount || 0;
                return (
                    <span className={`datatable-points ${points >= 0 ? 'positive' : 'negative'}`}>
                        {points > 0 ? '+' : ''}{points}
                    </span>
                );
            }
        }
    ];

    const filters = [
        {
            key: 'type',
            label: 'All Types',
            options: [
                { value: 'purchase', label: 'Purchase' },
                { value: 'redemption', label: 'Redemption' },
                { value: 'transfer', label: 'Transfer' },
                { value: 'adjustment', label: 'Adjustment' },
                { value: 'event', label: 'Event' },
            ]
        },
        {
            key: 'flow',
            label: 'All Points',
            options: [
                { value: 'in', label: 'Earned (+)' },
                { value: 'out', label: 'Spent (-)' },
            ],
            customFilter: (row, value) => {
                const amount = row.amount || 0;
                if (value === 'in') return amount >= 0;
                if (value === 'out') return amount < 0;
                return true;
            }
        }
    ];

    const searchKeys = ['id', 'type', 'remark', 'userid'];

    return (
        <DataTable
            title="Transaction History"
            data={transactions}
            columns={columns}
            filters={filters}
            searchKeys={searchKeys}
            pageSize={10}
            onRowClick={onTransactionSelect}
        />
    );
};

export default TransactionHistory;