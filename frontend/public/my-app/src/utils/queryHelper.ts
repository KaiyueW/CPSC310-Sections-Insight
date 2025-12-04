export const writeQuery = (queryType: string, datasetId: string) => {
	let query;

	switch (queryType) {
		case '1':
			query = {
				WHERE: {
					IS: {
						[`${datasetId}_dept`]: "cpsc",
					},
				},
				OPTIONS: {
					COLUMNS: ["countfail", "countpass"],
				},
				TRANSFORMATIONS: {
					GROUP: [`${datasetId}_dept`],
					APPLY: [
						{
							countfail: {
								COUNT: `${datasetId}_fail`,
							},
						},
						{
							countpass: {
								COUNT: `${datasetId}_pass`,
							},
						},
					],
				},
			};
			break;

		case '2':
			query = {
				WHERE: {
					AND: [
						{
							IS: {
								[`${datasetId}_dept`]: "cpsc",
							},
						},
						{
							GT: {
								[`${datasetId}_year`]: 2010,
							},
						},
					],
				},
				OPTIONS: {
					COLUMNS: [`${datasetId}_year`, "yearAVG"],
				},
				TRANSFORMATIONS: {
					GROUP: [`${datasetId}_year`],
					APPLY: [
						{
							yearAVG: {
								AVG: `${datasetId}_avg`,
							},
						},
					],
				},
			};
			break;

		case '3':
			query = {
				WHERE: {
					GT: {
						[`${datasetId}_fail`]: 150
					}
				},
				OPTIONS: {
					COLUMNS: [`${datasetId}_dept`, "count"]
				},
				TRANSFORMATIONS: {
					GROUP: [`${datasetId}_dept`],
					APPLY: [
						{
							count: {
								COUNT: `${datasetId}_fail`
							}
						}
					]
				}
			};
			break;
	}

	return query;
};
