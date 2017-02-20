export const getFrequencyPermission = (user, activeFrequency, frequencies) => {
  if (!user.uid) {
    return;
  }
  let uid = user.uid;
  if (activeFrequency !== 'everything') {
    // we wont' even show this if you're viewing everything, so skip
    let frequencyToEval = frequencies.filter(freq => {
      return freq.slug === activeFrequency;
    });

    let frequencyUsers = frequencyToEval[0].users;
    if (frequencyUsers[uid]) {
      // make sure this user is viewing a frequency they have joined
      let usersPerm = frequencyUsers[uid].permission;
      return usersPerm;
    } else {
      return; // the user isn't even part of the frequency
    }
  } else {
    return;
  }
};

export const getCurrentFrequency = (activeFrequency, frequencies) => {
  if (activeFrequency === 'everything') {
    return;
  }
  let obj = frequencies.filter(freq => {
    return freq.slug === activeFrequency || freq.id === activeFrequency;
  });
  return obj[0];
};
