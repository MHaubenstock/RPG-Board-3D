#pragma strict

var prefab : GameObject;
var target : Transform;
var other : GameObject;

static var numberSpawned = 0;

public var testArrayItems = new String[10];

function Start () {
	testArrayItems[2] = "Hello";
	
	Debug.Log(Vector3.Cross(Vector3(1,0,-1),Vector3(-1,0,2)));
	
	var myTest = other.GetComponent(PauseMenu);
	var index = myTest.myList.FindIndex(function(t : Transform) Vector3.Distance(t.position, transform.position) < 2);
	
}

function Update () {
	if(LevelSerializer.IsDeserializing)
	   return;
	 if(Time.timeScale == 0)
	    return;
	if(Random.Range(0,100) < 2) {
		numberSpawned++;
		var direction = target.transform.forward * ((Random.value * 8) + 2);
		direction = direction + target.transform.up * 8;
		direction = direction + ( target.transform.right * ( - 4 + ((Random.value * 8))));
		if(prefab != null)
			Instantiate(prefab, direction, Quaternion.identity);
		
	}
}


function OnGUI()
{
	GUILayout.BeginArea(Rect(0,Screen.height-60,100,100));
	GUILayout.Label(numberSpawned.ToString());
	GUILayout.EndArea();
	
}