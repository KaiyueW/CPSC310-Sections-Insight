import { useState } from 'react';
import AddDataset from './components/AddDataset';
import RemoveDataset from './components/RemoveDataset';
import ViewDataset from './components/ViewDataset';
import InsightQuery from './components/InsightQuery';
import DisplayChart from './components/DisplayChart';
import { writeQuery } from './utils/queryHelper';
import "./index.css"

interface InsightDataset {
	id: string;
	kind: 'sections' | 'rooms';
	numRows: number;
}

// ChatGPT told me to add this class to get rid of the any linter issue
interface QueryResultRow {
	countpass?: number;
	countfail?: number;
	sections_year?: number;
	yearAVG?: number;
	sections_dept?: string;
	count?: number;
	[key: string]: string | number | undefined;
}

interface ChartData {
	result: QueryResultRow[];
	queryType: string;
}

function App() {
	const [datasets, setDatasets] = useState<InsightDataset[]>([]);
	const [chartData, setChartData] = useState<ChartData | null>(null);
	const [loading, setLoading] = useState<boolean>(false);

	const viewDataset = async () => {
		try {
			const response = await fetch(`/datasets`);
			console.log(response.ok);
			if (response.ok) {
				const data = await response.json();
				setDatasets(data.result || []);
			}
		} catch (error) {
			console.error('Error showing datasets:', error);
		}
	};

	const handleAddDataset = async (id: string, file: File) => {
		setLoading(true);
		try {
			const contentBuffer = await file.arrayBuffer();
			const response = await fetch(`/dataset/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/x-zip-compressed'
				},
				body: contentBuffer
			});

			const data = await response.json();

			if (response.ok) {
				await viewDataset();
				return { success: true };
			} else {
				console.error('Add dataset error:', response.status, data);
				return { success: false, error: data.error || 'Failed to add dataset' };
			}
		} catch (error) {
			console.error('Add dataset network error:', error);
			return { success: false, error: 'Error connecting to server' };
		} finally {
			setLoading(false);
		}
	};

	const handleRemoveDataset = async (id: string) => {
		setLoading(true);
		try {
			const response = await fetch(`/dataset/${id}`, {
				method: 'DELETE'
			});

			const data = await response.json();

			if (response.ok) {
				await viewDataset();
				setChartData(null);
				return { success: true };
			} else {
				console.error('Remove dataset error:', response.status, data);
				return { success: false, error: data.error || 'Failed to remove dataset' };
			}
		} catch (error) {
			console.error('Remove dataset network error:', error);
			return { success: false, error: 'Error connecting to server' };
		} finally {
			setLoading(false);
		}
	};

	const handleInsightQuery = async (datasetId: string, queryType: string) => {
		const query = writeQuery(queryType, datasetId);

		setLoading(true);
		try {
			const response = await fetch(`/query`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(query)
			});

			const data = await response.json();

			if (response.ok) {
				if (!data || !Array.isArray(data.result)) {
					return { success: false, error: 'Invalid response format from server' };
				}
				setChartData({ result: data.result, queryType });
				return { success: true };
			} else {
				console.error('Query error:', response.status, data);
				return { success: false, error: data.error || 'Failed to execute query' };
			}
		} catch (error) {
			console.error('Query network error:', error);
			return { success: false, error: 'Error connecting to server' };
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen p-4 lg:p-6">

			<div className="flex justify-center items-center py-4 max-w-7xl mx-auto">
				<div className="title-container text-center w-full">
					<h1 className="text-4xl font-bold text-title mb-0">
						Section Insight
					</h1>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto">

				<div className="flex flex-col gap-4">
					<AddDataset onAdd={handleAddDataset} loading={loading} />
					<RemoveDataset datasets={datasets} onRemove={handleRemoveDataset} loading={loading} />
					<ViewDataset datasets={datasets} onReload={viewDataset} loading={loading} />
				</div>

				<div className="grid grid-rows-[1fr_1.2fr] gap-4">

					<InsightQuery datasets={datasets} onQuery={handleInsightQuery} loading={loading} />

					<div className="card rounded-2xl p-3 flex items-center justify-center border-2 chart-container">
						{chartData ? (
							<DisplayChart chartData={chartData} />
						) : (
							<div className="text-center">
								<p className="text-placeholder text-sm font-medium">
									Run a query to see the chart here
								</p>
							</div>
						)}
					</div>
				</div>

			</div>
		</div>


	);
};

export default App;
