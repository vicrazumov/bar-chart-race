# Bar Chart Race

![Urban population chart - The World Bank data](https://github.com/vicrazumov/bar-chart-race/raw/master/example/example.gif "Urban population chart")

A popular in 2019 way to visualize some dynamic stats. No third party libraries required, but non-ES5 compliant.

## Usage
```
const barChartRace = new BarChartRace(container, data);

window.addEventListener('resize', () => barChartRace.resize());

barChartRace.start();
```

## Data format
```
[
  {
    "year": 1960,
    "entries": [
      {
        "name": "Afghanistan",
        "value": 755783
      },
      {
        "name": "Albania",
        "value": 493982
      },
      {
        "name": "Algeria",
        "value": 3394203
      }
    ]
  }
]
```

## To Do
* rulers / scale
* config
* icons
* transpiling to ES5