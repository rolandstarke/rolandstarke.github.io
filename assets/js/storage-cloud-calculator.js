var storageApp = ((params = {}) => {
  const lang = document.documentElement.lang;
  const formatBytes = filesize.partial({ locale: lang });

  const formatNumber = Intl.NumberFormat(lang).format;
  const formatGb = (gb) => formatBytes(gb * 1000 * 1000 * 1000);
  const formatPricePrecise = Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format;
  const formatPriceVeryPrecise = Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', maximumFractionDigits: 20 }).format;
  const formatPrice = Intl.NumberFormat(lang, { style: 'currency', currency: 'USD' }).format;

  const offers = [
    {
      name: 'Amazon S3 Glacier Deep Archive', image: 'aws.svg', altText: 'AWS Logo',
      color: '#ffb400', key: 'aws-s3-glacier-deep-archive',
      costs(input) {
        const glacierStoragePricePerGib = 0.00099;
        const s3StoragePricePerGib = 0.023;
        const pricePerPutRequest = 0.00005;
        const pricePerRetrivalRequest = 0.000025;
        const priceRetrivalPerGib = 0.0025;
        const downloadPricePerGib = 0.09;
        const s3PricePerGetequest = 0.0000004;


        const numberOfFiles = Math.ceil(input.storageGb / input.filesizeInGb);

        const totalPutCosts = pricePerPutRequest * numberOfFiles;

        const glacierOverheadPerFile = 32 * 1024;
        const glacierOverheadBytes = numberOfFiles * glacierOverheadPerFile;
        const glacierOverheadPricePerMonth = (glacierOverheadBytes / 1024 / 1024 / 1024) * glacierStoragePricePerGib;

        const s3OverheadPerFile = 8 * 1024;
        const s3OverheadBytes = numberOfFiles * s3OverheadPerFile;
        const s3OverheadPricePerMonth = (s3OverheadBytes / 1024 / 1024 / 1024) * s3StoragePricePerGib;

        const glacierStoragePricePerMonth = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * glacierStoragePricePerGib;

        const totalMonthlyCosts = glacierOverheadPricePerMonth + s3OverheadPricePerMonth + glacierStoragePricePerMonth;
        const totalStorageCosts = (input.storageDurationYears * 12) * totalMonthlyCosts;

        const retrivalPriceTransfer = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * priceRetrivalPerGib;
        const retrivalPriceRequest = pricePerRetrivalRequest * numberOfFiles;
        const costDownload = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * downloadPricePerGib;
        const s3GetPriceRequest = numberOfFiles * s3PricePerGetequest;
        const costStoreRetrived = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * s3StoragePricePerGib / 30 * 7

        const totalRetrivalPriceOnce = retrivalPriceTransfer + retrivalPriceRequest + costDownload + s3GetPriceRequest;

        const totalRetrivalPrice = totalRetrivalPriceOnce * input.recovers;

        const total = totalPutCosts + totalStorageCosts + totalRetrivalPrice;

        const calculationHTML = `
                    <i>The calculation below excludes Free Tier discounts.</i> <br><br>

                    <small>
                    ${formatGb(input.storageGb)} storage / ${formatGb(input.filesizeInGb)} average file size = ${formatNumber(numberOfFiles)} files<br>
                    </small>
                    <br>

                    <small>
                    <i>Upload Trafic is Free</i><br>
                    ${formatNumber(numberOfFiles)} requests x ${formatPriceVeryPrecise(pricePerPutRequest)} = ${formatPricePrecise(totalPutCosts)} Cost for PUT requests<br>
                    </small>
                    <strong>Upload cost: ${formatPrice(totalPutCosts)}</strong> <br>
                    <br>

                    <small>
                    ${formatNumber(numberOfFiles)} files x ${filesize(glacierOverheadPerFile, { base: 2 })} = ${formatBytes(glacierOverheadBytes)} overhead<br>
                    ${formatBytes(glacierOverheadBytes)} x ${(formatPriceVeryPrecise(glacierStoragePricePerGib))}/GiB/Month = ${formatPricePrecise(glacierOverheadPricePerMonth)}/Month Glacier Deep Archive storage overhead cost<br>
                    </small>
                    <br>

                    <small>
                    ${formatNumber(numberOfFiles)} files x ${filesize(s3OverheadPerFile, { base: 2 })} = ${formatBytes(s3OverheadBytes)} overhead<br>
                    ${formatBytes(s3OverheadBytes)} x ${formatPriceVeryPrecise(s3StoragePricePerGib)}/GiB/Month = ${formatPricePrecise(s3OverheadPricePerMonth)}/Month S3 Standard storage overhead cost<br>
                    </small>
                    <br>

                    <small>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(glacierStoragePricePerGib)}/GiB/Month = ${formatPricePrecise(glacierStoragePricePerMonth)}/Month Glacier Deep Archive storage cost<br>
                    </small>
                    <br>

                    <small>
                    ${formatPricePrecise(glacierOverheadPricePerMonth)}/Month
                    + ${formatPricePrecise(s3OverheadPricePerMonth)}/Month
                    + ${formatPricePrecise(glacierStoragePricePerMonth)}/Month
                    = ${formatPricePrecise(totalMonthlyCosts)}/Month total storage cost<br>
                    ${formatPricePrecise(totalMonthlyCosts)}/Month x ${input.storageDurationYears} years = ${formatPrice(totalStorageCosts)} total storage cost<br>
                    </small>
                    <strong>Storage cost: ${formatPrice(totalStorageCosts)}</strong><br>
                    <br>

                    <small>
                    ${formatNumber(numberOfFiles)} requests x ${formatPriceVeryPrecise(pricePerRetrivalRequest)} = ${formatPricePrecise(retrivalPriceRequest)} Cost for Restore requests (Bulk)<br>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(priceRetrivalPerGib)}/GiB = ${formatPricePrecise(retrivalPriceTransfer)} Cost for Glacier Deep Archive Data Retrieval (Bulk)<br>
                    <br>

                    <i>We asume the restored files stay in the S3 Standart storage for 7 days</i><br>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(s3StoragePricePerGib)}/GiB/Month x 7 days =  ${formatPricePrecise(costStoreRetrived)} S3 Standard storage cost<br>
                    ${formatNumber(numberOfFiles)} requests x ${formatPriceVeryPrecise(s3PricePerGetequest)} = ${formatPricePrecise(s3GetPriceRequest)} Cost for GET requests<br>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(downloadPricePerGib)}/GiB = ${formatPricePrecise(costDownload)} Cost for Download Trafic<br>
                    <br>

                    ${formatPricePrecise(retrivalPriceRequest)}
                    + ${formatPricePrecise(retrivalPriceTransfer)}
                    + ${formatPricePrecise(costStoreRetrived)}
                    + ${formatPricePrecise(s3GetPriceRequest)}
                    + ${formatPricePrecise(costDownload)}
                    = ${formatPricePrecise(totalRetrivalPriceOnce)}/Recover total recover cost<br>
                    ${formatPricePrecise(totalRetrivalPriceOnce)} x ${input.recovers} recovers = ${formatPrice(totalRetrivalPrice)} total recover cost<br>
                    </small>
                    <strong>Recover cost: ${formatPrice(totalRetrivalPrice)}</strong><br>
                    <br>

                    <small>
                    ${formatPrice(totalPutCosts)} + ${formatPrice(totalStorageCosts)} + ${formatPrice(totalRetrivalPrice)} = ${formatPrice(total)} total price <br>
                    </small>
                    <strong>Total cost: ${formatPrice(total)}</strong>
                `;

        return {
          calculationHTML,
          total
        };
      }
    },


    {
      name: 'Amazon S3 Glacier Flexible Retrieval', image: 'aws.svg', altText: 'AWS Logo',
      color: '#ffb400', key: 'aws-s3-glacier-flexible-retrival',
      costs(input) {
        const glacierStoragePricePerGib = 0.0036;
        const s3StoragePricePerGib = 0.023;
        const pricePerPutRequest = 0.00003;
        const pricePerRetrivalRequest = 0;
        const priceRetrivalPerGib = 0;
        const downloadPricePerGib = 0.09;
        const s3PricePerGetequest = 0.0000004;


        const numberOfFiles = Math.ceil(input.storageGb / input.filesizeInGb);

        const totalPutCosts = pricePerPutRequest * numberOfFiles;

        const glacierOverheadPerFile = 32 * 1024;
        const glacierOverheadBytes = numberOfFiles * glacierOverheadPerFile;
        const glacierOverheadPricePerMonth = (glacierOverheadBytes / 1024 / 1024 / 1024) * glacierStoragePricePerGib;

        const s3OverheadPerFile = 8 * 1024;
        const s3OverheadBytes = numberOfFiles * s3OverheadPerFile;
        const s3OverheadPricePerMonth = (s3OverheadBytes / 1024 / 1024 / 1024) * s3StoragePricePerGib;

        const glacierStoragePricePerMonth = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * glacierStoragePricePerGib;

        const totalMonthlyCosts = glacierOverheadPricePerMonth + s3OverheadPricePerMonth + glacierStoragePricePerMonth;
        const totalStorageCosts = (input.storageDurationYears * 12) * totalMonthlyCosts;

        const retrivalPriceTransfer = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * priceRetrivalPerGib;
        const retrivalPriceRequest = pricePerRetrivalRequest * numberOfFiles;
        const costDownload = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * downloadPricePerGib;
        const s3GetPriceRequest = numberOfFiles * s3PricePerGetequest;
        const costStoreRetrived = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * s3StoragePricePerGib / 30 * 7

        const totalRetrivalPriceOnce = retrivalPriceTransfer + retrivalPriceRequest + costDownload + s3GetPriceRequest;

        const totalRetrivalPrice = totalRetrivalPriceOnce * input.recovers;

        const total = totalPutCosts + totalStorageCosts + totalRetrivalPrice;

        const calculationHTML = `
                    <i>The calculation below excludes Free Tier discounts.</i> <br><br>

                    <small>
                    ${formatGb(input.storageGb)} storage / ${formatGb(input.filesizeInGb)} average file size = ${formatNumber(numberOfFiles)} files<br>
                    </small>
                    <br>

                    <small>
                    <i>Upload Trafic is Free</i><br>
                    ${formatNumber(numberOfFiles)} requests x ${formatPriceVeryPrecise(pricePerPutRequest)} = ${formatPricePrecise(totalPutCosts)} Cost for PUT requests<br>
                    </small>
                    <strong>Upload cost: ${formatPrice(totalPutCosts)}</strong> <br>
                    <br>

                    <small>
                    ${formatNumber(numberOfFiles)} files x ${filesize(glacierOverheadPerFile, { base: 2 })} = ${formatBytes(glacierOverheadBytes)} overhead<br>
                    ${formatBytes(glacierOverheadBytes)} x ${(formatPriceVeryPrecise(glacierStoragePricePerGib))}/GiB/Month = ${formatPricePrecise(glacierOverheadPricePerMonth)}/Month Glacier Flexible Retrieval storage overhead cost<br>
                    </small>
                    <br>

                    <small>
                    ${formatNumber(numberOfFiles)} files x ${filesize(s3OverheadPerFile, { base: 2 })} = ${formatBytes(s3OverheadBytes)} overhead<br>
                    ${formatBytes(s3OverheadBytes)} x ${formatPriceVeryPrecise(s3StoragePricePerGib)}/GiB/Month = ${formatPricePrecise(s3OverheadPricePerMonth)}/Month S3 Standard storage overhead cost<br>
                    </small>
                    <br>

                    <small>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(glacierStoragePricePerGib)}/GiB/Month = ${formatPricePrecise(glacierStoragePricePerMonth)}/Month Glacier Flexible Retrieval storage cost<br>
                    </small>
                    <br>

                    <small>
                    ${formatPricePrecise(glacierOverheadPricePerMonth)}/Month
                    + ${formatPricePrecise(s3OverheadPricePerMonth)}/Month
                    + ${formatPricePrecise(glacierStoragePricePerMonth)}/Month
                    = ${formatPricePrecise(totalMonthlyCosts)}/Month total storage cost<br>
                    ${formatPricePrecise(totalMonthlyCosts)}/Month x ${input.storageDurationYears} years = ${formatPrice(totalStorageCosts)} total storage cost<br>
                    </small>
                    <strong>Storage cost: ${formatPrice(totalStorageCosts)}</strong><br>
                    <br>

                    <small>
                    ${formatNumber(numberOfFiles)} requests x ${formatPriceVeryPrecise(pricePerRetrivalRequest)} = ${formatPricePrecise(retrivalPriceRequest)} Cost for Restore requests (Bulk)<br>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(priceRetrivalPerGib)}/GiB = ${formatPricePrecise(retrivalPriceTransfer)} Cost for Glacier Deep Archive Data Retrieval (Bulk)<br>
                    <br>

                    <i>We asume the restored files stay in the S3 Standart storage for 7 days</i><br>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(s3StoragePricePerGib)}/GiB/Month x 7 days =  ${formatPricePrecise(costStoreRetrived)} S3 Standard storage cost<br>
                    ${formatNumber(numberOfFiles)} requests x ${formatPriceVeryPrecise(s3PricePerGetequest)} = ${formatPricePrecise(s3GetPriceRequest)} Cost for GET requests<br>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(downloadPricePerGib)}/GiB = ${formatPricePrecise(costDownload)} Cost for Download Trafic<br>
                    <br>

                    ${formatPricePrecise(retrivalPriceRequest)}
                    + ${formatPricePrecise(retrivalPriceTransfer)}
                    + ${formatPricePrecise(costStoreRetrived)}
                    + ${formatPricePrecise(s3GetPriceRequest)}
                    + ${formatPricePrecise(costDownload)}
                    = ${formatPricePrecise(totalRetrivalPriceOnce)}/Recover total recover cost<br>
                    ${formatPricePrecise(totalRetrivalPriceOnce)} x ${input.recovers} recovers = ${formatPrice(totalRetrivalPrice)} total recover cost<br>
                    </small>
                    <strong>Recover cost: ${formatPrice(totalRetrivalPrice)}</strong><br>
                    <br>

                    <small>
                    ${formatPrice(totalPutCosts)} + ${formatPrice(totalStorageCosts)} + ${formatPrice(totalRetrivalPrice)} = ${formatPrice(total)} total price <br>
                    </small>
                    <strong>Total cost: ${formatPrice(total)}</strong>
                `;

        return {
          calculationHTML,
          total
        };
      }
    },

    {
      name: 'Google Cloud Archive Storage', image: 'google.png', altText: 'Google Cloud Logo',
      color: '#e75f24', key: 'google-cloud-archive-storage',
      costs(input) {
        const storagePricePerGib = 0.0012;
        const priceRetrivalPerGib = 0.05;
        const downloadPricePerGib = 0.11;
        const pricePerPutRequest = 0.50 / 10000;
        const pricePerGetequest = 0.50 / 10000;


        const numberOfFiles = Math.ceil(input.storageGb / input.filesizeInGb);

        const totalPutCosts = pricePerPutRequest * numberOfFiles;


        const storagePricePerMonth = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * storagePricePerGib;

        const totalStorageCosts = (input.storageDurationYears * 12) * storagePricePerMonth;

        const retrivalPriceTransfer = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * priceRetrivalPerGib;
        const costDownload = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * downloadPricePerGib;
        const getPriceRequest = numberOfFiles * pricePerGetequest;

        const totalRetrivalPriceOnce = retrivalPriceTransfer + costDownload + getPriceRequest;

        const totalRetrivalPrice = totalRetrivalPriceOnce * input.recovers;

        const total = totalPutCosts + totalStorageCosts + totalRetrivalPrice;

        const calculationHTML = `
                    <i>The calculation below excludes Free Tier discounts.</i> <br><br>

                    <small>
                    ${formatGb(input.storageGb)} storage / ${formatGb(input.filesizeInGb)} average file size = ${formatNumber(numberOfFiles)} files<br>
                    </small>
                    <br>

                    <small>
                    <i>Upload Trafic is Free</i><br>
                    ${formatNumber(numberOfFiles)} requests x ${formatPriceVeryPrecise(pricePerPutRequest)} = ${formatPricePrecise(totalPutCosts)} Cost for PUT requests<br>
                    </small>
                    <strong>Upload cost: ${formatPrice(totalPutCosts)}</strong> <br>
                    <br>

                    <small>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(storagePricePerGib)}/GiB/Month = ${formatPricePrecise(storagePricePerMonth)}/Month storage cost<br>
                    ${formatPricePrecise(storagePricePerMonth)}/Month x ${input.storageDurationYears} years = ${formatPrice(totalStorageCosts)} total storage cost<br>
                    </small>
                    <strong>Storage cost: ${formatPrice(totalStorageCosts)}</strong><br>
                    <br>

                    <small>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(priceRetrivalPerGib)}/GiB = ${formatPricePrecise(retrivalPriceTransfer)} Cost for Data Retrieval<br>
                    ${formatNumber(numberOfFiles)} requests x ${formatPriceVeryPrecise(pricePerGetequest)} = ${formatPricePrecise(getPriceRequest)} Cost for GET requests<br>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(downloadPricePerGib)}/GiB = ${formatPricePrecise(costDownload)} Cost for Download Trafic<br>
                    <br>

                    ${formatPricePrecise(retrivalPriceTransfer)}
                    + ${formatPricePrecise(getPriceRequest)}
                    + ${formatPricePrecise(costDownload)}
                    = ${formatPricePrecise(totalRetrivalPriceOnce)}/Recover total recover cost<br>
                    ${formatPricePrecise(totalRetrivalPriceOnce)} x ${input.recovers} recovers = ${formatPrice(totalRetrivalPrice)} total recover cost<br>
                    </small>
                    <strong>Recover cost: ${formatPrice(totalRetrivalPrice)}</strong><br>
                    <br>

                    <small>
                    ${formatPrice(totalPutCosts)} + ${formatPrice(totalStorageCosts)} + ${formatPrice(totalRetrivalPrice)} = ${formatPrice(total)} total price <br>
                    </small>
                    <strong>Total cost: ${formatPrice(total)}</strong>
                `;

        return {
          calculationHTML,
          total
        };
      }
    },

    {
      name: 'Azure Archive Blob Storage', image: 'azure.webp', altText: 'Azure Logo',
      color: '#035bda', key: 'azure-archive-blob-storage',
      costs(input) {
        const storagePricePerGib = 0.00099;
        const priceRetrivalPerGib = 0.022;
        const downloadPricePerGib = 0.08;
        const pricePerPutRequest = 0.143 / 10000;
        const pricePerGetequest = 7.15 / 10000;


        const numberOfFiles = Math.ceil(input.storageGb / input.filesizeInGb);

        const totalPutCosts = pricePerPutRequest * numberOfFiles;


        const storagePricePerMonth = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * storagePricePerGib;

        const totalStorageCosts = (input.storageDurationYears * 12) * storagePricePerMonth;

        const retrivalPriceTransfer = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * priceRetrivalPerGib;
        const costDownload = ((input.storageGb * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * downloadPricePerGib;
        const getPriceRequest = numberOfFiles * pricePerGetequest;

        const totalRetrivalPriceOnce = retrivalPriceTransfer + costDownload + getPriceRequest;

        const totalRetrivalPrice = totalRetrivalPriceOnce * input.recovers;

        const total = totalPutCosts + totalStorageCosts + totalRetrivalPrice;

        const calculationHTML = `
                    <i>The calculation below excludes Free Tier discounts.</i> <br><br>

                    <small>
                    ${formatGb(input.storageGb)} storage / ${formatGb(input.filesizeInGb)} average file size = ${formatNumber(numberOfFiles)} files<br>
                    </small>
                    <br>

                    <small>
                    <i>Upload Trafic is Free</i><br>
                    ${formatNumber(numberOfFiles)} requests x ${formatPriceVeryPrecise(pricePerPutRequest)} = ${formatPricePrecise(totalPutCosts)} Cost for PUT requests<br>
                    </small>
                    <strong>Upload cost: ${formatPrice(totalPutCosts)}</strong> <br>
                    <br>

                    <small>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(storagePricePerGib)}/GiB/Month = ${formatPricePrecise(storagePricePerMonth)}/Month storage cost<br>
                    ${formatPricePrecise(storagePricePerMonth)}/Month x ${input.storageDurationYears} years = ${formatPrice(totalStorageCosts)} total storage cost<br>
                    </small>
                    <strong>Storage cost: ${formatPrice(totalStorageCosts)}</strong><br>
                    <br>

                    <small>
                    <i>Azure does not provide pricing for restore requests? we asume its free</i><br>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(priceRetrivalPerGib)}/GiB = ${formatPricePrecise(retrivalPriceTransfer)} Cost for Data Retrieval<br>
                    ${formatNumber(numberOfFiles)} requests x ${formatPriceVeryPrecise(pricePerGetequest)} = ${formatPricePrecise(getPriceRequest)} Cost for GET requests<br>
                    ${formatGb(input.storageGb)} x ${formatPriceVeryPrecise(downloadPricePerGib)}/GiB = ${formatPricePrecise(costDownload)} Cost for Download Trafic<br>
                    <br>

                    ${formatPricePrecise(retrivalPriceTransfer)}
                    + ${formatPricePrecise(getPriceRequest)}
                    + ${formatPricePrecise(costDownload)}
                    = ${formatPricePrecise(totalRetrivalPriceOnce)}/Recover total recover cost<br>
                    ${formatPricePrecise(totalRetrivalPriceOnce)} x ${input.recovers} recovers = ${formatPrice(totalRetrivalPrice)} total recover cost<br>
                    </small>
                    <strong>Recover cost: ${formatPrice(totalRetrivalPrice)}</strong><br>
                    <br>

                    <small>
                    ${formatPrice(totalPutCosts)} + ${formatPrice(totalStorageCosts)} + ${formatPrice(totalRetrivalPrice)} = ${formatPrice(total)} total price <br>
                    </small>
                    <strong>Total cost: ${formatPrice(total)}</strong>
                `;

        return {
          calculationHTML,
          total
        };
      }
    },


    {
      name: 'Wazabi', image: 'wazabi.webp', color: '#07d667', key: 'wazabi', altText: 'Wazabi Logo',
      costs(input) {
        const storagePricePerGib = 0.00585;
        const minimumStorage = 1 * (Math.pow(2, 40) / Math.pow(10, 12)) * 1000; //1TiB in TB * 1000 = GB
        let usedStorage = input.storageGb;
        let minStoragNote = '';
        if (minimumStorage > input.storageGb && input.storageGb > 0) {
          usedStorage = minimumStorage;
          minStoragNote = '<i>There is a minimum Storage usage of 1TiB.</i><br>';
        }

        const storageCostsPerMonth = ((usedStorage * 1000 * 1000 * 1000) / 1024 / 1024 / 1024) * storagePricePerGib;
        const totalStorageCosts = storageCostsPerMonth * input.storageDurationYears * 12;
        const total = totalStorageCosts;


        const calculationHTML = `
                    <strong>Upload cost: ${formatPrice(0)}</strong> <br>
                    <br>

                    <small>
                    ${minStoragNote}
                    ${formatGb(usedStorage)} x ${formatPriceVeryPrecise(storagePricePerGib)}/GiB/Month = ${formatPricePrecise(storageCostsPerMonth)}/Month storage cost<br>
                    ${formatPricePrecise(storageCostsPerMonth)}/Month x ${input.storageDurationYears} years = ${formatPrice(totalStorageCosts)} total storage cost<br>
                    </small>
                    <strong>Storage cost: ${formatPrice(totalStorageCosts)}</strong><br>
                    <br>

                    <small>
                    <i>There is a trafic limit that you can only download the size of your bucket once a month.</i><br>
                    </small>
                    <strong>Recover cost: ${formatPrice(0)}</strong><br>
                    <br>

                    <strong>Total cost: ${formatPrice(total)}</strong>
                `;

        return {
          calculationHTML,
          total
        };
      }
    },
  ];

  return {
    results: [],
    input: {
      storageDurationYears: '10',
      storageGb: '1000',
      filesizeInGb: '0.001',
      recovers: '1',
    },
    resultMaxCost: undefined,
    resultShown: null,
    resultToDisplay: params.resultToDisplay,
    init() {
      this.$watch('input', this.calculateResults.bind(this));
      this.$watch('resultToDisplay', () => { this.resultShown = this.results.find(r => r.offer.key === this.resultToDisplay) });
      this.$watch('results', () => { this.resultShown = this.results.find(r => r.offer.key === this.resultToDisplay) });
      this.calculateResults();
    },
    calculateResults() {
      this.results = offers.map((offer) => {
        const costs = offer.costs(this.input);
        return {
          offer,
          costs,
        };
      }).sort((a, b) => a.costs.total - b.costs.total);
      this.resultMaxCost = this.results[this.results.length - 1].costs.total;

    },
    formatPriceUnprecise(price) {
      return new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', maximumSignificantDigits: 3 }).format(price);
    },
    formatGb(gb) {
      return formatBytes(gb * 1000 * 1000 * 1000);
    },
    formatCompact(number) {
      return new Intl.NumberFormat(lang, { notation: 'compact', compactDisplay: 'long' }).format(number);
    },
    scrollToCalculationIfNeeded() {
      const rect = this.$refs.calculation.getBoundingClientRect();
      const marginFromBrowserEdge = 200;

      const isInView = (
        rect.bottom + marginFromBrowserEdge <= (window.innerHeight || document.documentElement.clientHeight)
      );

      if (!isInView) {
        this.$refs.calculation.scrollIntoView({ block: 'start', behavior: 'smooth' })
      }
    },

  };
});
