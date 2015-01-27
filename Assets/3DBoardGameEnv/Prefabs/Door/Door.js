class Door extends WorldObject
{	
	var doorOpen : boolean = false;
	
	function OnInteraction()
	{
		if(doorOpen)
			networkView.RPC("closeDoor", RPCMode.All);
		else
			networkView.RPC("openDoor", RPCMode.All);
	}
	
	@RPC
	function closeDoor()
	{
		if(animation.isPlaying)
			animation.CrossFade("CloseDoor", 0.2);
		else
			animation.Play("CloseDoor");
			
		doorOpen = false;
	}
	
	@RPC
	function openDoor()
	{
		if(animation.isPlaying)
			animation.CrossFade("OpenDoor", 0.2);
		else
			animation.Play("OpenDoor");
			
		doorOpen = true;
	}
}