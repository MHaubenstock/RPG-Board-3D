var centerScreen : Vector2 = Vector2(Screen.width / 2, Screen.height / 2);

var speed : int = 5;
var crosshair : Texture;
var transPieceMat : Material;
var transDelMat : Material;
var pieces : GameObject[];

private var activePiece : GameObject;
private var transPiece : GameObject;
private var transPieceYRotation : int = 0;
private var tempMat : Material;
private var tempRenderer : Renderer;
static var inBuildMode : boolean = true;
private var mouseLook : MouseLook;
private var dmToolbarPos : Rect = Rect (20, 20, 300, 300);
private var loadGameWindowPos : Rect = Rect (500, 20, 300, 150);
private var objectOptionsPos : Rect = Rect (200, 200, 300, 300);
private var undo : UndoOperation = new UndoOperation();

function Start()
{
	Screen.lockCursor = true;
	mouseLook = GetComponent(MouseLook);
	iTween.CameraFadeAdd();
	activePiece = pieces[0];
}

function Update()
{
	if(Input.GetKeyDown(KeyCode.Tab))
	{
		if(inBuildMode)
		{
			inBuildMode = false;
			BroadcastMessage("OnEnterMenuMode", SendMessageOptions.DontRequireReceiver);
		}
		else
		{
			inBuildMode = true;
			BroadcastMessage("OnEnterBuildMode", SendMessageOptions.DontRequireReceiver);
		}
	}
			
	if(inBuildMode)
	{
		//Controls camera movement
		var directionVector = new Vector3(Input.GetAxis("Horizontal"), 0, Input.GetAxis("Vertical"));
		
		if(Input.GetKey(KeyCode.LeftShift))
			directionVector *= 2;
	
		if(Input.GetKey(KeyCode.Space))
			transform.Translate(Vector3.up * speed * 2 * Time.deltaTime, Space.World);
		
		transform.Translate(directionVector * speed * Time.deltaTime);
		//
		
		//Controls block placement
		//var ray = Camera.main.ScreenPointToRay(centerScreen);
		var ray = Camera.main.ScreenPointToRay(Vector2(Screen.width / 2, Screen.height / 2));
		var hit : RaycastHit;
			
		//If the crosshairs are pointing at an object
		if(Physics.Raycast(ray, hit, 100))
		{
			//If holding right-click
			if(Input.GetMouseButton(1) || Input.GetKey(KeyCode.LeftAlt))
			{
				destroyTransCube();
			
				if(hit.transform.tag != "Terrain")
				{
					changeViewedRenderer(hit);
										
					if(Input.GetMouseButtonDown(0))
					{
						
						//networkView.RPC("undoAddObject", RPCMode.AllBuffered, hit.transform, UndoOpType.Replace);
						//undo.addObject(hit.transform.gameObject, UndoOpType.Replace);
						//Destroy(hit.transform.gameObject);
						//Network.Destroy(hit.transform.gameObject);
						networkView.RPC("destroyBlock", RPCMode.AllBuffered, hit.transform.gameObject.networkView.viewID);
					}
				}
				else
				{
					resetDelTransCube();
				}
			}
			//If not holding right-click
			else
			{
				var blockPosition : Vector3 = getAnchorPosition(hit);
				
				if(!transPiece)
				{
					transPiece = Instantiate(activePiece, blockPosition, Quaternion.identity);//Instantiate(transparentCube, blockPosition, Quaternion.identity);
					transPiece.transform.eulerAngles.y = transPieceYRotation;
					transPiece.collider.enabled = false;
					
					//
					transPiece.GetComponent(WorldObject).enabled = false;
					
					if(transPiece.renderer)
						transPiece.renderer.material = transPieceMat;
						
					for(var ren : Renderer in transPiece.GetComponentsInChildren(Renderer))
					{
						ren.material = transPieceMat;
					}
				}
								
				transPiece.transform.position = blockPosition;
				
				if(x > 0 && y > 0 && z > 0)
				{
					transPiece.transform.localScale = Vector3(x, y, z);
				}
				
				if(Input.GetMouseButtonDown(0))
				{
					var go : GameObject  = Network.Instantiate(activePiece, blockPosition, transPiece.transform.rotation, 1);//GameObject.CreatePrimitive(PrimitiveType.Cube);
					
					//go.transform.position = blockPosition;
					
					//go.AddComponent(Rigidbody);
					
					
					//go.transform.localScale = transPiece.transform.localScale;
					//networkView.RPC("applyAfterSpawnChanges", RPCMode.AllBuffered, go.networkView.viewID, transPiece.transform.localScale);
					if(go.GetComponent(WorldObject))
						go.GetComponent(WorldObject).OnInstantiation(transPiece.transform.localScale);
					
					
					//undo.addObject(go, UndoOpType.Remove);
					//networkView.RPC("undoAddObject", RPCMode.AllBuffered, go.transform, UndoOpType.Remove);
				}
			}
			
			if(Input.GetKeyDown(KeyCode.E))
			{
				hit.transform.gameObject.BroadcastMessage("OnInteraction", SendMessageOptions.DontRequireReceiver);
			}	
		}
		//if ray not hitting anything
		else
		{
			destroyTransCube();
			resetDelTransCube();
		}
		
		if(Input.GetMouseButtonUp(1))
			resetDelTransCube();
		//
		
		//Miscellaneous button functions
		toolbarButtons();
		
		if(Input.GetKeyDown(KeyCode.R))
		{
			if(transPiece)
			{
				transPiece.transform.Rotate(Vector3(0, 90, 0));
				transPieceYRotation = transPiece.transform.eulerAngles.y;
			}
		}
		
		if(Input.GetKeyDown(KeyCode.F))
		{
			gameObject.light.enabled = !gameObject.light.enabled;
		}
		
		/*
		if(Input.GetKeyDown(KeyCode.Z))
		{
			if(undo.log.length > 0)
				undo.performUndo();
		}
		*/
		/*
		if(Input.GetKeyDown(KeyCode.F2))
		{
			destroyTransCube();
			resetDelTransCube();
		
			LevelSerializer.SaveGame("D&D World Builder");
		}
		*/
		//
	}
	//If in menu mode
	else
	{
		
	}
}

function toolbarButtons()
{
	if(Input.GetKeyDown(KeyCode.Alpha1))
		objGridInt = 0;
		
	if(Input.GetKeyDown(KeyCode.Alpha2))
		objGridInt = 1;
		
	if(Input.GetKeyDown(KeyCode.Alpha3))
		objGridInt = 2;
		
	if(Input.GetKeyDown(KeyCode.Alpha4))
		objGridInt = 3;
		
	if(Input.GetKeyDown(KeyCode.Alpha5))
		objGridInt = 4;
		
	if(Input.GetKeyDown(KeyCode.Alpha6))
		objGridInt = 5;
}

@RPC
function applyAfterSpawnChanges(objectNetID : NetworkViewID, objectScale : Vector3)
{
	var go : GameObject = (NetworkView.Find(objectNetID)).transform.gameObject;
	
	if(x > 0 && y > 0 && z > 0)
	{
		go.transform.localScale = objectScale;
	}
	
	if(go.GetComponent(WorldObject))
	{
		//go.GetComponent(WorldObject).OnInstantiation();
		go.GetComponent(WorldObject).enabled = false;	
	}
}

@RPC
function destroyBlock(netID : NetworkViewID)
{
	NetworkView.Find(netID).transform.gameObject.GetComponent(WorldObject).OnObjectDestroyed();
	Destroy((NetworkView.Find(netID)).transform.gameObject);
}

function getAnchorPosition(hit : RaycastHit)
{
	var blockPosition : Vector3 = Vector3(Mathf.Round(hit.point.x + (Mathf.Sign(hit.point.x - hit.transform.position.x) * 0.01)), Mathf.Round(hit.point.y + (Mathf.Sign(hit.point.y - hit.transform.position.y) * 0.01)), Mathf.Round(hit.point.z + (Mathf.Sign(hit.point.z - hit.transform.position.z) * 0.01)));
	
	if(x > 0 && y > 0 && z > 0 && transPiece)
	{	
		var rotatedBy180 : boolean = Mathf.Floor(transPieceYRotation % 180) == 0;
	
		if(hit.point.y == (hit.transform.position.y + hit.transform.lossyScale.y / 2))
			blockPosition.y += (Mathf.Floor(y / 2) - (1 - (y % 2)));
			
		else if(hit.point.y == (hit.transform.position.y - hit.transform.lossyScale.y / 2))
			blockPosition.y += -(Mathf.Floor(y / 2));
			
		else
			blockPosition.y += (Mathf.Floor(y / 2) - (1 - (y % 2)));
		
		//not detecting side hit on stretched sides of objects
		
		switch(Mathf.Floor(transPieceYRotation) / 90)
		{
			case 0:
				//x+
				if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x + hitScale(hit, "x")))
				{
					blockPosition.x += (Mathf.Floor(x / 2) - (1 - (x % 2)));
					blockPosition.z += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				}
				
				//x-	
				else if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x - hitScale(hit, "x")))
				{
					blockPosition.x += -(Mathf.Floor(x / 2));
					blockPosition.z += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				}
				
				//z+
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z + hitScale(hit, "z")))
				{
					blockPosition.z += (Mathf.Floor(z / 2) - (1 - (z % 2)));
					blockPosition.x += (Mathf.Floor(x / 2) - (1 - (x % 2)));
				}
				
				//z-	
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z - hitScale(hit, "z")))
				{
					blockPosition.z += -(Mathf.Floor(z / 2));
					blockPosition.x += (Mathf.Floor(x / 2) - (1 - (x % 2)));
				}
				else
				{
					blockPosition.x += (Mathf.Floor(x / 2) - (1 - (x % 2)));
					blockPosition.z += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				}
				
				break;
			
			case 1:
				
				if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x + hitScale(hit, "x")))
				{
					blockPosition.x += (Mathf.Floor(z / 2) - (1 - (z % 2)));
					blockPosition.z -= (Mathf.Floor(x / 2));
				}
				
				//x-	
				else if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x - hitScale(hit, "x")))
				{
					blockPosition.x += -(Mathf.Floor(z / 2));
					blockPosition.z -= (Mathf.Floor(x / 2));
				}
				
				//z+
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z + hitScale(hit, "z")))
				{
					blockPosition.z += (Mathf.Floor(x / 2) - (1 - (x % 2)));
					blockPosition.x += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				}
				
				//z-	
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z - hitScale(hit, "z")))
				{
					blockPosition.z += -(Mathf.Floor(x / 2));
					blockPosition.x += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				}
				else
				{
					blockPosition.z -= (Mathf.Floor(x / 2));
					blockPosition.x += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				}
				
				break;
				
			case 2:
				
				//x+
				if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x + hitScale(hit, "x")))
				{
					blockPosition.x += (Mathf.Floor(x / 2) - (1 - (x % 2)));
					//z+
					blockPosition.z += -(Mathf.Floor(z / 2));
				}
				
				//x-	
				else if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x - hitScale(hit, "x")))
				{
					blockPosition.x += -(Mathf.Floor(x / 2));
					//z+
					blockPosition.z += -(Mathf.Floor(z / 2));
				}
				
				//z+
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z + hitScale(hit, "z")))
				{
					blockPosition.z += (Mathf.Floor(z / 2) - (1 - (z % 2)));
					//+x
					blockPosition.x += -(Mathf.Floor(x / 2));
				}
				
				//z-	
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z - hitScale(hit, "z")))
				{
					blockPosition.z += -(Mathf.Floor(z / 2));
					//+x
					blockPosition.x += -(Mathf.Floor(x / 2));
				}
				else
				{
					blockPosition.x += -(Mathf.Floor(x / 2));
					blockPosition.z += -(Mathf.Floor(z / 2));
				}
			
				break;
			
			case 3:
				
				//x+
				if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x + hitScale(hit, "x")))
				{
					blockPosition.x += (Mathf.Floor(z / 2) - (1 - (z % 2)));
					blockPosition.z += (Mathf.Floor(x / 2) - (1 - (x % 2)));
				}
				
				//x-	
				else if(roundToTenth(hit.point.x) == roundToTenth(hit.transform.position.x - hitScale(hit, "x")))
				{
					blockPosition.x += -(Mathf.Floor(z / 2));
					blockPosition.z += (Mathf.Floor(x / 2) - (1 - (x % 2)));
				}
				
				//z+
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z + hitScale(hit, "z")))
				{
					blockPosition.z += (Mathf.Floor(x / 2) - (1 - (x % 2)));
					blockPosition.x += -(Mathf.Floor(z / 2));
				}
				
				//z-	
				else if(roundToTenth(hit.point.z) == roundToTenth(hit.transform.position.z - hitScale(hit, "z")))
				{
					blockPosition.z += -(Mathf.Floor(x / 2));
					blockPosition.x += -(Mathf.Floor(z / 2));
				}
				else
				{
					blockPosition.z += (Mathf.Floor(x / 2) - (1 - (x % 2)));
					blockPosition.x += -(Mathf.Floor(z / 2));
				}
			
				break;
		}
		
		if(x % 2 == 0)
		{
			if(rotatedBy180)
				blockPosition.x += 0.5;
			else
				blockPosition.z += 0.5;
		}
		
		if(y % 2 == 0)
			blockPosition.y += 0.5;
			
		if(z % 2 == 0)
		{
			if(rotatedBy180)
				blockPosition.z += 0.5;
			else
				blockPosition.x += 0.5;
		}
	}
	
	return blockPosition;
}

function hitScale(hit : RaycastHit, axis : String)
{
	if(axis.ToLower() == "x")
	{
		if(Mathf.Floor(hit.transform.eulerAngles.y) % 180 == 0)
			return hit.transform.lossyScale.x / 2;
		else
			return hit.transform.lossyScale.z / 2;
	}
	else if(axis.ToLower() == "z")
	{
		if(Mathf.Floor(hit.transform.eulerAngles.y) % 180 == 0)
			return hit.transform.lossyScale.z / 2;
		else
		{
			return hit.transform.lossyScale.x / 2;
		}
	}

	return 0;
}

function roundToTenth(num : float)
{
	return Mathf.Round((num * 10) + 0.01) / 10;
}

function changeViewedRenderer(hit : RaycastHit)
{
	var hitRenderer : Renderer = hit.transform.renderer;
	
	if(hitRenderer)
	{
		if(tempRenderer != null)
		{
			if (tempRenderer == hitRenderer)
				return;
			else
				tempRenderer.material = tempMat;
		}
	
		tempRenderer = hitRenderer;
		tempMat = hitRenderer.material;
		tempRenderer.material = transDelMat;
	} 
	else 
	{
		resetDelTransCube();
	}
}

function destroyTransCube()
{
	if(transPiece)
		Destroy(transPiece);
}

function resetDelTransCube()
{
	if (tempRenderer != null)
	{
		tempRenderer.material = tempMat;
		tempRenderer = null;
	}
}

function OnEnterBuildMode()
{
	Screen.lockCursor = true;
	mouseLook.enabled = true;
	
	iTween.CameraFadeTo(0, 0.4);
}

function OnEnterMenuMode()
{
	Screen.lockCursor = false;
	mouseLook.enabled = false;
	
	destroyTransCube();
	resetDelTransCube();
	
	iTween.CameraFadeTo(0.2, 0.4);
}

function OnNewPieceSelected()
{
	destroyTransCube();
	
	activePiece = pieces[objGridInt];
	
	if(activePiece.transform.localScale.x > 1 || activePiece.transform.localScale.y > 1 || activePiece.transform.localScale.z > 1)
	{
		x = activePiece.transform.localScale.x;
		xS = x.ToString();
		
		y = activePiece.transform.localScale.y;
		yS = y.ToString();
		
		z = activePiece.transform.localScale.z;
		zS = z.ToString();
	}
}

function OnGUI()
{
	GUI.Label(Rect(10, 100, 500, 40), "Screen width: " + Screen.width + " Screen height: " + Screen.height);

	if(inBuildMode)
	{
		//GUI.Label(Rect(centerScreen.x - 20, centerScreen.y - 20, 40, 40), crosshair);
		GUI.Label(Rect((Screen.width / 2) - 20, (Screen.height / 2) - 20, 40, 40), crosshair);
		
		GUILayout.BeginArea(Rect(0, 0, Screen.width / 2, 200));
		
		objGridInt = GUILayout.SelectionGrid(objGridInt, objStrings, 6);
		
		GUILayout.EndArea();
	}
	else
	{
		dmToolbarPos = GUI.Window (0, dmToolbarPos, DoToolbarWindow, "DM's Toolbar");
		//loadGameWindowPos = GUI.Window (1, loadGameWindowPos, DoLoadWindow, "Load World");
		
		if(activePiece.GetComponent(WorldObject))
			objectOptionsPos = GUI.Window (2, objectOptionsPos, DoOptionsWindow, objStrings[objGridInt] + " + Settings");
	}
	
	if(objGridInt != lastObjGridInt)
	{
		OnNewPieceSelected();
	}
	
	lastObjGridInt = objGridInt;
}

private var x : int = 0;
private var y : int = 0;
private var z : int = 0;
private var xS : String = "";
private var yS : String = "";
private var zS : String = "";
private var objGridInt : int = 0;
private var lastObjGridInt : int = 0;
private var objStrings : String[] = ["Block", "Stairs", "Torch", "Door", "Treasure Chest", "Bust", "Table", "Half-Block", "Chair", "Curved Block"];

function DoToolbarWindow(windowID : int)
{
	xS = GUI.TextField (Rect (20, 20, 25, 20), xS, 2);
	GUI.Label(Rect(52, 20, 25, 20), "x");
	yS = GUI.TextField (Rect (70, 20, 25, 20), yS, 2);
	GUI.Label(Rect(102, 20, 25, 20), "x");
	zS = GUI.TextField (Rect (120, 20, 25, 20), zS, 2);

	if(xS != "" && yS != "" && zS != "")
	{
		try
		{
			x = parseInt(xS);
			y = parseInt(yS);
			z = parseInt(zS);
		}
		catch(e)
		{
			x = 0;
			y = 0;
			z = 0;
			GUI.Label(Rect(10, 60, 100, 25), "Must be 1-99!");
		}
	}
	
	objGridInt = GUI.SelectionGrid (Rect (25, 100, 200, 50), objGridInt, objStrings, 3);
	
	GUI.DragWindow (Rect (0,0,10000,10000));
}

function DoLoadWindow(windowID : int)
{
	GUILayout.BeginVertical(); 
    GUILayout.FlexibleSpace();
    
    GUILayout.Space(60);
    
    for(var sg in LevelSerializer.SavedGames[LevelSerializer.PlayerName])
    { 
		if(GUILayout.Button(sg.Caption))
		{ 
			sg.Load(); 
			Time.timeScale = 1;
		} 
	}
     
    GUILayout.FlexibleSpace();
    GUILayout.EndVertical();
    
	GUI.DragWindow (Rect (0,0,10000,10000));
}

function DoOptionsWindow(windowID : int)
{
	GUILayout.BeginVertical(); 
    GUILayout.FlexibleSpace();
    
    if(activePiece.GetComponent(WorldObject))
		activePiece.GetComponent(WorldObject).MenuOptionsGUI();
     
    GUILayout.FlexibleSpace();
    GUILayout.EndVertical();
    
	GUI.DragWindow (Rect (0,0,10000,10000));
}

@RPC
function undoAddObject(object : Transform, type : UndoOpType)
{
	undo.addObject(object.gameObject, type);
}

public class UndoOperation
{
	var log : Array = new Array();
	
	function addObject(object : GameObject, type : UndoOpType)
	{
		log.Add(new UndoLog(type, object));
		
		switch(type)
		{
			case UndoOpType.Replace:
				
				object.SetActiveRecursively(false);
				
				break;
				
			case UndoOpType.Remove:
				
				object.SetActiveRecursively(true);
				
				break;
		}
		
		if(log.length > 20)
			GameObject.Destroy(log.Shift() as GameObject);
	}
	
	function performUndo()
	{
		var undoObject : UndoLog = (log.Pop() as UndoLog);
		
		switch(undoObject.type)
		{
			case UndoOpType.Replace:
				
				undoObject.object.SetActiveRecursively(true);
				
				break;
				
			case UndoOpType.Remove:
				
				undoObject.object.SetActiveRecursively(false);
				
				break;
		}
	}
}

public class UndoLog
{
	var type : UndoOpType;
	var object : GameObject;
	
	function UndoLog(thisType : UndoOpType, thisObject : GameObject)
	{
		type = thisType;
		object = thisObject;
	}
}

enum UndoOpType
{
	Replace,
	Remove
}

/*
function getAnchorPosition(hit : RaycastHit)
{
	var blockPosition : Vector3 = Vector3(Mathf.Round(hit.point.x + (Mathf.Sign(hit.point.x - hit.transform.position.x) * 0.01)), Mathf.Round(hit.point.y + (Mathf.Sign(hit.point.y - hit.transform.position.y) * 0.01)), Mathf.Round(hit.point.z + (Mathf.Sign(hit.point.z - hit.transform.position.z) * 0.01)));
	
	if(x > 0 && y > 0 && z > 0 && transPiece)
	{	
		var rotatedBy180 : boolean = Mathf.Floor(transPieceYRotation % 180) == 0;
	
		if(hit.point.y == (hit.transform.position.y + hit.transform.lossyScale.y / 2))
			blockPosition.y += (Mathf.Floor(y / 2) - (1 - (y % 2)));
			
		else if(hit.point.y == (hit.transform.position.y - hit.transform.lossyScale.y / 2))
			blockPosition.y += -(Mathf.Floor(y / 2));
			
		else
			blockPosition.y += (Mathf.Floor(y / 2) - (1 - (y % 2)));
		
		switch(Mathf.Floor(transPieceYRotation) / 90)
		{
			case 0:
				
				blockPosition.x += (Mathf.Floor(x / 2) - (1 - (x % 2)));
				blockPosition.z += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				
				break;
				
			case 1:
				
				blockPosition.z -= (Mathf.Floor(x / 2));
				blockPosition.x += (Mathf.Floor(z / 2) - (1 - (z % 2)));
				
				break;
				
			case 2:
				
				blockPosition.x -= (Mathf.Floor(x / 2));
				blockPosition.z -= (Mathf.Floor(z / 2));
			
				break;
				
			case 3:
				
				blockPosition.z += (Mathf.Floor(x / 2) - (1 - (x % 2)));
				blockPosition.x -= (Mathf.Floor(z / 2));
			
				break;
		}
		
		if(x % 2 == 0)
		{
			if(rotatedBy180)
				blockPosition.x += 0.5;
			else
				blockPosition.z += 0.5;
		}
		
		if(y % 2 == 0)
			blockPosition.y += 0.5;
			
		if(z % 2 == 0)
		{
			if(rotatedBy180)
				blockPosition.z += 0.5;
			else
				blockPosition.x += 0.5;
		}
	}
	
	return blockPosition;
}
*/