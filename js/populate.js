// Associate location hash with content IDs
const types = {
    '#TRA': '#content_tra',
    '#TRB': '#content_trb',
    '#TRG': '#content_trg',
    '#TRD': '#content_trd',
    '#IGH': '#content_igh',
    '#IGL': '#content_igl',
    '#IGK': '#content_igk',
    '#TCR': '#content_tcr',
    '#BCR': '#content_bcr',
    '#PCA': '#content_pca',
    '#DIV': '#content_diversity',
    '#ICA': '#content_ICA',
    '#PSCA': '#content_PSCA',
    '#OL': '#content_ol',
    '#CIT': '#content_cit',
    '#CT': '#content_ct',
    '#CS': '#content_cs',
    '': 'blank'
};

// Associate plot identifiers with plot labels
const plot_labels = {
    'cdr3aaLength': ['CDR3 amino acid length distribution', 'CDR3 Length, AA', 'Frequency', 'Clonotype'],
    'cdr3ntLength': ['CDR3 nucleotide length distribution', 'CDR3 Length, bp', 'Count'],
    'vsumBarplot': ['V Gene Usage', 'V Gene', 'Frequency'],
    'dsumBarplot': ['D Gene Usage', 'D Gene', 'Frequency'],
    'jsumBarplot': ['J Gene Usage', 'J Gene', 'Frequency'],
    'csumBarplot': ['C Gene Usage', 'C Gene', 'Frequency'],
    'vjStackBar': ['V-J Gene Usage', 'V Gene', 'Frequency', 'J Gene']
};

// Define a whitelist of allowed data paths
const ALLOWED_DATA_PATHS = ['data/', 'another_allowed_path/'];

// Validate data_path against the whitelist
function isValidDataPath(path) {
    return ALLOWED_DATA_PATHS.includes(path);
}

// Sanitize data_path to prevent directory traversal
function sanitizeDataPath(path) {
    let previous;
    do {
        previous = path;
        path = path.replace(/(\.\.\/|\.\/)/g, '');
    } while (path !== previous);
    return path;
}

// Utility function to sanitize text content using DOMPurify
function sanitizeText(text) {
    // Strip all HTML tags and attributes
    return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

// Get current sample value from URL
let current_sample = new URL(location.href).searchParams.get('sample');
if (current_sample === null) {
    current_sample = "All";
}

// Function to safely append buttons to cohort_select
function appendCohortButtons(lines) {
    lines.forEach(line => {
        const [pathVal, buttonLabel] = line.split(",");
        if (!pathVal || !buttonLabel) return; // Skip invalid lines

        const sanitizedPathVal = sanitizeText(pathVal.trim());
        const sanitizedButtonLabel = sanitizeText(buttonLabel.trim());

        const button = $('<button>', {
            type: 'button',
            class: 'btn btn-outline-secondary btn-sm mr-1',
            text: sanitizedButtonLabel,
            click: function () {
                change_path_val(sanitizedPathVal);
            }
        });
        $("#cohort_select").append(button);
    });
}

// Function to get validated and sanitized data_path
function getDataPath(callback) {
    let path_val = 'data/'; // default path

    if (sessionStorage.getItem('path_val') !== null) {
        path_val = sanitizeDataPath(sessionStorage.getItem('path_val'));
        if (isValidDataPath(path_val)) {
            callback(path_val);
        } else {
            console.error('Invalid data path in sessionStorage:', path_val);
            // Handle invalid path_val appropriately
            sessionStorage.setItem('path_val', 'data/');
            callback('data/');
        }
    } else {
        $.get("cohort_list.csv", function (data) {
            let fetched_path_val = data.split("\n")[0].split(",")[0].trim();
            fetched_path_val = fetched_path_val.replace(/\/?$/, '/'); // Ensure it ends with '/'
            fetched_path_val = sanitizeDataPath(fetched_path_val);

            if (isValidDataPath(fetched_path_val)) {
                sessionStorage.setItem('path_val', fetched_path_val);
                callback(fetched_path_val);
                // Optionally, reload the page to apply the new path_val
                location.reload();
            } else {
                console.error('Invalid data path fetched:', fetched_path_val);
                // Handle invalid path_val appropriately, e.g., set to default or show error
                sessionStorage.setItem('path_val', 'data/');
                callback('data/');
                location.reload();
            }
        }, 'text');
    }
}

// Populate figures based on sample ID
if (['segment_usage.html', 'cdr3_length.html', "cohort_analysis.html"].includes(window.location.pathname.split('/').pop())) {
    $(document).ready(function () {
        getDataPath(function (data_path) {
            $('.plotlyBar').each(function () {
                load_plotly_bar(data_path, $(this).attr("id"));
            });
            $('.plotlyStackedBar').each(function () {
                load_plotly_stacked_bar(data_path, $(this).attr("id"));
            });
        });
    });
}

// Populate information table from info.csv
if (['info.html'].includes(window.location.pathname.split('/').pop())) {
    $(document).ready(function () {
        if (current_sample === "All") {
            $("#info_title").text("Cohort Info");
        } else {
            $("#info_title").text("Sample Info");
        }
    });

    getDataPath(function (data_path) {
        d3.text(`${data_path}${encodeURIComponent(current_sample)}/info.csv`).then(function (data) {
            const parsedCSV = d3.csvParseRows(data);
            d3.select("#tableSpace")
                .selectAll("tr")
                .data(parsedCSV)
                .enter()
                .append("tr")
                .selectAll("td")
                .data(function (d) { return d; })
                .enter()
                .append("td")
                .text(function (d) { return d; }); // Safe as .text() escapes content
        });
    });
}

// Handle index.html and default page
if (['index.html', ''].includes(window.location.pathname.split('/').pop())) {
    $(document).ready(function () {

        // Check if overview.png exists
        $.ajax({
            url: "img/overview.png",
            type: 'HEAD',
            success: function () {
                $('#overview-figure').removeAttr('style');
            }
        });

        // Set data_path from sessionStorage or default
        getDataPath(function (data_path) {
            $('#path_field').val(data_path);

            // Handle path selection
            $('#path_select').on('click', function () {
                let path_val = $('#path_field').val();
                path_val = sanitizeDataPath(path_val.replace(/\/?$/, '/'));
                if (isValidDataPath(path_val)) {
                    sessionStorage.setItem('path_val', path_val);
                    location.reload();
                } else {
                    alert('Invalid path selected.');
                }
            });

            // Populate cohort buttons
            $.get("cohort_list.csv", function (data) {
                const lines = data.split("\n");
                appendCohortButtons(lines);
            }, 'text');

            // Render Markdown content safely using DOMPurify
            d3.text("home.md").then(function (data) {
                const md = window.markdownit();
                const renderedHTML = md.render(data);
                const sanitizedHTML = DOMPurify.sanitize(renderedHTML);
                $('#markdown').html(sanitizedHTML); // Safe insertion
            });

            parseData("cohort_table.csv", jsonToCohortTable);
        });

        // Check if path_val is still null after AJAX call
        if (sessionStorage.getItem('path_val') === null) {
            sessionStorage.setItem('path_val', 'data/');
            $('#path_field').val('data/');
        }
    });
}

// Populate information table from info.csv for cohort_analysis.html
if (['cohort_analysis.html'].includes(window.location.pathname.split('/').pop())) {
    $(document).ready(function () {
        getDataPath(function (data_path) {
            const data_sheet = {
                null: 'intracohort_data.csv',
                'db': 'db_data.csv'
            };
            const data_sheet_param = new URL(location.href).searchParams.get('data');
            const data_sheet_url = data_sheet[data_sheet_param] || 'intracohort_data.csv'; // Default to 'intracohort_data.csv' if undefined

            parseData(`${data_path}${encodeURIComponent(data_sheet_url)}`, jsonToTable);
            $("#statsCSV").attr('href', `${data_path}${encodeURIComponent(data_sheet_url)}`);

            $.ajax({
                url: `${data_path}meta.csv`, // Here is the main concern
                type: 'HEAD',
                success: function () {
                    $('#cohortMetaTable').removeAttr('style');
                    parseData(`${data_path}meta.csv`, jsonToMetaTable);
                    $("#metaCSV").attr('href', `${data_path}meta.csv`);

                    parseData(`${data_path}meta.csv`, jsonToSampleSelectTable);
                },
                error: function () {
                    populate_page();
                    $('#heatmapDiv').parent().hide();
                    $('#sample-selection-button').hide();
                }
            });
        });
    });
}

// Handle export buttons for cohort_analysis.html
if (['cohort_analysis.html'].includes(window.location.pathname.split('/').pop())) {
    $(document).on('click', '.btn-export', function () {
        let xval_in = parseInt($(this).parent().find('.xval-in').val());
        if (isNaN(xval_in)) {
            xval_in = parseInt($(this).parent().find('.xval-in').prop("defaultValue"));
        }

        let yval_in = parseInt($(this).parent().find('.yval-in').val());
        if (isNaN(yval_in)) {
            yval_in = parseInt($(this).parent().find('.yval-in').prop("defaultValue"));
        }

        const plotlyDiv = $(this).parent().find('.js-plotly-plot').attr('id');
        const exportName = sanitizeText(plotlyDiv.replace("Div", "_plot"));
        let save_format = '';

        if ($(this).hasClass('save-png')) {
            save_format = 'png';
        } else if ($(this).hasClass('save-svg')) {
            save_format = 'svg';
        }

        save_img(plotlyDiv, save_format, exportName, xval_in, yval_in);
    });
} else {
    $(document).on('click', '.btn-export', function () {
        let xval_in = parseInt($(this).closest('.parent-selector').find('.xval-in').val());
        if (isNaN(xval_in)) {
            xval_in = parseInt($(this).closest('.parent-selector').find('.xval-in').prop("defaultValue"));
        }

        let yval_in = parseInt($(this).closest('.parent-selector').find('.yval-in').val());
        if (isNaN(yval_in)) {
            yval_in = parseInt($(this).closest('.parent-selector').find('.yval-in').prop("defaultValue"));
        }

        const plotlyDiv = $(this).closest('.parent-selector').find('.js-plotly-plot').attr('id');
        const sanitizedSample = sanitizeText(current_sample);
        const sanitizedPlotlyDiv = sanitizeText(plotlyDiv.replace(".csv", "").replace("/", "_").replace("Div", ""));
        const exportName = `${sanitizedSample}_${sanitizedPlotlyDiv}`;
        let save_format = '';

        if ($(this).hasClass('save-png')) {
            save_format = 'png';
        } else if ($(this).hasClass('save-svg')) {
            save_format = 'svg';
        }

        save_img(plotlyDiv, save_format, exportName, xval_in, yval_in);
    });
}
