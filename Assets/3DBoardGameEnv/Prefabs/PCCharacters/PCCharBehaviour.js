class PCCharBehaviour extends WorldObject
{
	function OnInteraction()
	{
		if(GetComponentInChildren(Light).enabled)
			networkView.RPC("shutOffLight", RPCMode.All);
		else
			networkView.RPC("turnOnLight", RPCMode.All);
	}
	
	function movePiece()
	{
		//set up line renderer on points being moved to
		//PlayerCharacter.anchorPos;
		
	//	while(
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