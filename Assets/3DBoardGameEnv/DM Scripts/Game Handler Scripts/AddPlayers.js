var DM : GameObject;
var PC : GameObject;

function OnNetworkLoadedLevel()
{	
	if(PlayerPrefs.GetString("PlayerType") == "DM")
		var dm : GameObject = Network.Instantiate(DM, Vector3.zero, Quaternion.identity, 1);
	else if(PlayerPrefs.GetString("PlayerType") == "Player")
		var pc : GameObject = Network.Instantiate(PC, Vector3.zero, Quaternion.identity, 1);
}