const AttendanceChart = {

    chart: null,

    load() {

        if (!window.studentAttendance) return;

        const subjects = window.studentAttendance.map(s => s.subject.name);

        const percentages = window.studentAttendance.map(s => s.percentage);

        const ctx = document
            .getElementById("attendanceChart")
            .getContext("2d");

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {

            type: "bar",

            data: {

                labels: subjects,

                datasets: [{

                    data: percentages,

                    backgroundColor: "#6c35de",

                    borderRadius: 8,

                    borderSkipped: false,

                    maxBarThickness: 45

                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                animation: {
                    duration: 1200
                },

                plugins: {

                    legend: {
                        display: false
                    },

                    tooltip: {

                        callbacks: {

                            label(context){

                                const item =
                                    window.studentAttendance[
                                        context.dataIndex
                                    ];

                                return [
                                    "Attendance : " + item.percentage + "%",
                                    "Present : " + item.present,
                                    "Absent : " + item.absent,
                                    "Total : " + item.total
                                ];

                            }

                        }

                    }

                },

                scales: {

                    y: {

                        beginAtZero: true,

                        max: 100,

                        ticks: {

                            callback: value => value + "%"

                        }

                    },

                    x: {

                        ticks: {

                            autoSkip: false,

                            maxRotation: 30,

                            minRotation: 30

                        }

                    }

                }

            }

        });

    }

};