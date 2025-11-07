$(function () {
    var i = setInterval(function () {
        if ($('#navBar').length) {
            clearInterval(i);
            // Wait until navbar is loaded
            var current_pathname = $(location).attr('pathname');
            // For cohort_analysis, don't assign URLs in page based off of current pathname
            if (current_pathname.split('/').pop() === "cohort_analysis.html") {
                current_pathname = current_pathname.replace(/cohort_analysis.html$/, "cdr3_length.html");
            } else if ($.inArray(window.location.pathname.split('/').pop(), ["index.html", ""]) >= 0) {
                current_pathname = "cdr3_length.html";
            }

            // Prepend 'All" selection to dropdown menu safely
            const allLink = $('<a>', {
                class: 'sampleSelect dropdown-item',
                id: 'All',
                href: `${current_pathname}?sample=All${location.hash}`,
                text: 'All'
            });
            $('#dropdown-populate').prepend(allLink);

            // Populate sample selection based off of sample_list.csv
            var sample_list_path = "data/sample_list.csv";
            if (sessionStorage.getItem('path_val') != null) {
                var path_val = sessionStorage.getItem('path_val');
                sample_list_path = path_val + "sample_list.csv";
            } else {
                $.get("cohort_list.csv", function (data) {
                    var path_val = data.split("\n")[0].split(",")[0];
                    path_val = path_val.replace(/\/?$/, '/');
                    sessionStorage.setItem('path_val', path_val);
                    sample_list_path = path_val + "sample_list.csv";
                }, 'text');
            }

            $.get(sample_list_path, function (data) {
                var lines = data.split("\n");
                if ($.inArray(window.location.pathname.split('/').pop(), ["cohort_analysis.html", "index.html", ""]) === -1) {
                    for (var i = 0; i < lines.length; i++) {
                        const sanitizedSample = $('<div>').text(lines[i]).html();
                        const sampleLink = $('<a>', {
                            class: 'sampleSelect sampleSearch dropdown-item',
                            id: sanitizedSample, // Ensure IDs are valid and sanitized
                            href: `${current_pathname}?sample=${encodeURIComponent(lines[i])}${location.hash}`,
                            text: lines[i]
                        });
                        $('#dropdown-populate').append(sampleLink);
                    }
                } else {
                    for (var i = 0; i < lines.length; i++) {
                        const sanitizedSample = $('<div>').text(lines[i]).html();
                        const sampleLink = $('<a>', {
                            class: 'sampleSelect sampleSearch dropdown-item',
                            id: sanitizedSample, // Ensure IDs are valid and sanitized
                            href: `${current_pathname}?sample=${encodeURIComponent(lines[i])}`,
                            text: lines[i]
                        });
                        $('#dropdown-populate').append(sampleLink);
                    }
                }
            }, 'text');

            // Modify navbar links based off current URL
            $(document).ready(function () {
                $("#info").attr("href", `info.html?sample=${encodeURIComponent(current_sample)}`);
                
                if ($.inArray(window.location.pathname.split('/').pop(), ["cohort_analysis.html", "index.html", ""]) === -1) {
                    $("#segment_usage").attr("href", `segment_usage.html?sample=${encodeURIComponent(current_sample)}${location.hash}`);
                    $("#cdr3_length").attr("href", `cdr3_length.html?sample=${encodeURIComponent(current_sample)}${location.hash}`);
                } else {
                    $("#segment_usage").attr("href", `segment_usage.html?sample=${encodeURIComponent(current_sample)}`);
                    $("#cdr3_length").attr("href", `cdr3_length.html?sample=${encodeURIComponent(current_sample)}`);
                }

                // Toggle Cohort Analysis link
                if (current_sample === "All") {
                    $("#cohort_analysis").attr("class", "nav-link nav-a");
                    $("#cohort_analysis_status").attr("class", "nav-item active");
                    $('#cohort_analysis_expanded_button').prop('disabled', false);
                }

                // db data availability
                $.ajax({
                    url: path_val + "db_data.csv",
                    type: 'HEAD',
                    error: function () {
                        $('#cohort_analysis').show();
                    },
                    success: function () {
                        $('#cohort_analysis_expanded').show();
                    }
                });
            });

            // Current sample display on dropdown
            $('#chosen_sample').text(current_sample);

            // Search dropdown samples
            $(document).ready(function () {
                $("#searchSamples").on("keyup", function () {
                    var value = $(this).val().toLowerCase();
                    $(".sampleSearch").filter(function () {
                        $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
                    });
                });
            });

            $.get(path_val + encodeURIComponent(current_sample) + "/info.csv")
                .done(function () {
                    $('#info').show();
                });

            // Show cohort name
            $(document).ready(function () {
                if (sessionStorage.getItem('path_val') !== "data/" && sessionStorage.getItem('path_val') != null) {
                    const pathSegments = sessionStorage.getItem('path_val').split("/");
                    const cohortName = $('<div>').text(pathSegments[pathSegments.length - 2]).html();
                    $("#header_desc").text(`${cohortName} Immune Repertoire`);
                }
            });
        }
    }, 100);
});
