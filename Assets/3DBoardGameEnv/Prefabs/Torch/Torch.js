class Torch extends WorldObject
{
	function OnInteraction()
	{
		if(GetComponentInChildren(Light).enabled)
			networkView.RPC("shutOffLight", RPCMode.All);
		else
			networkView.RPC("turnOnLight", RPCMode.All);
	}
	
	@RPC
	function shutOffLight()
	{
		for(light in GetComponentsInChildren(Light))
			light.enabled = false;
	}
	
	@RPC
	function turnOnLight()
	{
		for(light in GetComponentsInChildren(Light))
			light.enabled = true;
	}
}