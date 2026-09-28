// Let's test how Grafana data frames work with reduce
console.log('Testing Grafana data frame reduce logic');

// If a frame has fields:
// Time: [t1, t2, t3]
// Value: ['str1', 'str2', 'str3']

// If we apply transformation "reduce":
// It creates a frame with:
// Field 'Field': ['Value']
// Field 'Count': [3] (type number!)
//
// Then the Stat panel sees the numeric field 'Count' with value 3!
