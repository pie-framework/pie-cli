<template>
  <div>I am a vue component here is my <code>msg</code>:
	<span class="example">{{msg}}</span></div>
</template>
<script>
export default {
  props: { msg : {type: String, default: 'default' }}
}
</script>

<style>
	.example {
		color: red;
	}
</style>