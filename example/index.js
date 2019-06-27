fetch('/dataset.json').then(response => response.json()).then(data => {
  const container = document.querySelector('#container');
  const stats = new BarChartRace(container, data);

  stats.start();
});