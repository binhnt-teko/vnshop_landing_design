import React from 'react';

function Index(props) {
  return <h1>Hello {props.match.params.username}!</h1>;
}

export default Index;
