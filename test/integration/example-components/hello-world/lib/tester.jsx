import React from 'react';

export default class Tester extends React.Component{
  render(){
    return <div>hello world: {this.props.msg}</div>;
  }
}