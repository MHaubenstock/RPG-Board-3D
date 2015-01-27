var otherMaterials : Material[];
var materialIndex : int = 0;
var options : Texture[];
var radialBackground : Texture;
var cursor : Texture;
var moveIcon : Texture;
var useGravity : boolean = false;
var move : ActionOption;
var editStats : ActionOption;
private var availableActions : ActionOption[];

static var actionFunction : Function;
private var wasShowingDial : boolean = false;
private var dialCursorPos : Vector2;
private var dialCenter : Vector2;
private var radialRect : Rect;
private var cursorRect : Rect;
private var optionSize : Vector2 = new Vector2(Screen.width * 0.02, Screen.width * 0.02);
private var initRadialMenu : boolean = false;
private var selectingAction : boolean = false;
private var selectedPath : Vector3[];

function Start()
{
	radialRect = new Rect((Screen.width / 2) - (radialBackground.width / 2), (Screen.height / 2) - (radialBackground.width / 2), radialBackground.width, radialBackground.width);
	cursorRect = new Rect((Screen.width / 2) - (cursor.width / 2), (Screen.height / 2) - (cursor.width / 2), cursor.width, cursor.width);
	
	var availAct : Array = new Array();
	
	if(move.available)
	{
		move.actionFunction = moveCharacter;
		availAct.Add(move);
	}
	
	if(editStats.available)
	{
		editStats.actionFunction = statsEdit;
		availAct.Add(editStats);
	}
	
	availableActions = availAct.ToBuiltin(ActionOption);
	
	//may need to remove this as it may become obsolete
	lastMoveTime = Time.time;
}

//will need to take out update function eventually. to expensive to have in every world object
var lastMoveTime : float;
function FixedUpdate()
{
	if(useGravity)
	{
		var hit : RaycastHit;
		
	    if (Physics.Raycast (transform.position, -Vector3.up, hit))
	    {
	        var distanceToGround = hit.distance;
	        
	        if(distanceToGround > 0.5 && Time.time - lastMoveTime > 1)
	        {
	        	transform.position.y -= 1;
	        	
	        	lastMoveTime = Time.time;
	        }
	        else if(distanceToGround <= 0.5)
	        {
	        	lastMoveTime = Time.time;
	        }
	    }
	}
}

function OnNeighborDestroyed()
{
	Debug.Log(transform.position);
}

function OnObjectDestroyed()
{
	for(block in getSurroundingBlocks())
	{
		block.BroadcastMessage("OnNeighborDestroyed");
	}
}


function getSurroundingBlocks()
{
	var surBlocks : Array = new Array();
	var hit : RaycastHit;
	var distanceToObject : float;
	
	//Up
	if (Physics.Raycast (transform.position, Vector3.up, hit))
	{
		distanceToObject = hit.distance;
	
		if(distanceToObject <= 0.5)
			surBlocks.Add(hit.transform.gameObject);
	}
	
	//Down
	if (Physics.Raycast (transform.position, -Vector3.up, hit))
	{
		distanceToObject = hit.distance;
	
		if(distanceToObject <= 0.5 && hit.transform.tag != "Terrain")
			surBlocks.Add(hit.transform.gameObject);
	}
	
	//Left
	if (Physics.Raycast (transform.position, -Vector3.right, hit))
	{
		distanceToObject = hit.distance;
	
		if(distanceToObject <= 0.5)
			surBlocks.Add(hit.transform.gameObject);
	}
	
	//Right
	if (Physics.Raycast (transform.position, Vector3.right, hit))
	{
		distanceToObject = hit.distance;
	
		if(distanceToObject <= 0.5)
			surBlocks.Add(hit.transform.gameObject);
	}
			
	//Forward
	if (Physics.Raycast (transform.position, Vector3.forward, hit))
	{
		distanceToObject = hit.distance;
	
		if(distanceToObject <= 0.5)
			surBlocks.Add(hit.transform.gameObject);
	}

	//Back
	if (Physics.Raycast (transform.position, -Vector3.forward, hit))
	{
		distanceToObject = hit.distance;
	
		if(distanceToObject <= 0.5)
			surBlocks.Add(hit.transform.gameObject);
	}

	return surBlocks.ToBuiltin(GameObject);
}

function moveCharacter()
{
	Debug.Log("Start move action");
	StartCoroutine("moveRoutine");
}

function moveRoutine()
{
	PlayerCharacter.mouseControlActive = false;

	//var c2 : Color = Color.red;
	var lengthOfLineRenderer : int = 0;
	var lineRenderer : LineRenderer;
	var lastAnchorPos : Vector3;
	var linePosCount : int = 0;
	var vertexPos : Array = new Array();
	
	if(GetComponent(LineRenderer))
		lineRenderer = gameObject.GetComponent(LineRenderer);
	else
	{
		lineRenderer = gameObject.AddComponent(LineRenderer);
		lineRenderer.material = new Material (Shader.Find("Particles/Additive"));
		lineRenderer.SetColors(Color.red, Color.red);
		lineRenderer.SetWidth(0.2,0.2);
	}
	
	vertexPos.Add(transform.position);
	lineRenderer.SetVertexCount(1);
	lineRenderer.SetPosition(0, transform.position);
	
	while(!Input.GetKeyDown(KeyCode.Return))//Input.GetMouseButtonDown(0) || !Input.GetMouseButtonDown(1))
	{
		if(PlayerCharacter.anchorPos != vertexPos[vertexPos.length - 1])
		{
			lineRenderer.SetVertexCount(vertexPos.length + 1);
		
			var pos : Vector3 = squaresInDirection(1, vertexPos[vertexPos.length - 1], PlayerCharacter.anchorPos);
					
			lineRenderer.SetPosition(vertexPos.length, pos);
			
			if(Input.GetMouseButtonDown(0))
			{
				vertexPos.Add(pos);
			}
		}
		
		if(Input.GetMouseButtonDown(1))
		{
			if(vertexPos.length > 1)
				vertexPos.Pop();
		}
		
		yield;
	}
	
	for(var v : int = 1; v < vertexPos.length; v++)	//start with index 1 because index 0 is at starting point
	{
		networkView.RPC("setSelectedPath", RPCMode.AllBuffered, vertexPos[v]);
	}
	
	networkView.RPC("performMove", RPCMode.AllBuffered);
	
	//for(var v : int = 1; v < path.length; v++)	//start with index 1 because index 0 is at starting point
	//{
	/*
	var vPos : Vector3[] = vertexPos.ToBuiltin(Vector3);
	var v : int = 1;
	
	while(v < vPos.length)
	{
		networkView.RPC("performMove", RPCMode.AllBuffered, vPos[v]);
	
		v++;
		yield;
	}
	*/
	//}
	
	PlayerCharacter.mouseControlActive = true;
	lineRenderer.SetVertexCount(0);
	vertexPos.Clear();
}

function squaresInDirection(squares : int, origin : Vector3, end : Vector3)
{
	var direction : Vector3 = end - origin;
	return origin + Vector3(Mathf.Sign(direction.x) * Mathf.Clamp01(Mathf.Abs(direction.x)) * squares, Mathf.Sign(direction.y) * Mathf.Clamp01(Mathf.Abs(direction.y)) * squares, Mathf.Sign(direction.z) * Mathf.Clamp01(Mathf.Abs(direction.z)) * squares);
}

var selectedPathArray : Array = new Array();

@RPC
function setSelectedPath(vertex : Vector3)
{
	selectedPathArray.Add(vertex);
}

@RPC
function performMove()
{
	var vertexPoints : Vector3[] = selectedPathArray.ToBuiltin(Vector3);
	Debug.Log("Perform Move");
	for(v in vertexPoints)
	{
		var from : Vector3 = transform.position;
		var rayProgress : int = 0;
		var moveSpeed : float = 30;
		
		while(rayProgress < moveSpeed)
		{
			transform.position = Vector3.Lerp(from, v, ++rayProgress / moveSpeed);			
				
			yield;
		}
	}
	
	selectedPathArray.Clear();	
}

/*
@RPC
function performMove(path : Vector3[])
{
	var from : Vector3 = transform.position;
	var rayProgress : int = 0;
	var moveSpeed : float = 30;
	
	while(rayProgress < moveSpeed)
	{
		transform.position = Vector3.Lerp(from, path[v], ++rayProgress / moveSpeed);			
					
		yield;
	}
}
*/

function statsEdit()
{
	Debug.Log("Editing the statistics");
}

function MenuOptionsGUI()
{
	GUILayout.BeginArea(Rect(0, 0, Screen.width, Screen.height));

	if(otherMaterials.length > 0)
		texturePicker();
	
	GUILayout.EndArea();
}

function defaultAction()
{
}

function OnInstantiation(scale : Vector3)
{
	networkView.RPC("changeObject", RPCMode.AllBuffered, scale, materialIndex);
}

@RPC
function changeObject(scale : Vector3, matIndex : int)
{
	this.transform.localScale = scale;

	if(otherMaterials.length > 0)
	{
		materialIndex = matIndex;
	
		if(this.renderer && this.transform.tag != "IgnoreMatChange")
			this.renderer.material = otherMaterials[materialIndex];
		
		for(var rend : Renderer in GetComponentsInChildren(Renderer))
		{
			if(rend.transform.tag != "IgnoreMatChange")
				rend.material = otherMaterials[materialIndex];
		}
	}
	
	//this.enabled = false;
}

function texturePicker()
{
	var matTextures : Texture[] = new Texture[otherMaterials.length];
	
	for(var t : int = 0; t < matTextures.length; t++)
		matTextures[t] = otherMaterials[t].mainTexture;

	materialIndex = GUI.SelectionGrid(Rect(20, 20, 100, 50), materialIndex, matTextures, 4);
}

function showRadialMenu()
{
	GUI.Label(radialRect, radialBackground);
	var tet = Rect(0,0,10,10);
	tet.center = radialRect.center;
	GUI.Label(tet, cursor);
	
	//if just started showing dial
	if(!initRadialMenu)
	{
		cursorRect.center = Vector2((Screen.width / 2), (Screen.height / 2));
		initRadialMenu = true;
	}
	//if continuing showing dial
	else
	{
		var cursorMove : Vector2 = Vector2(Input.GetAxis("Mouse X") * 3, -Input.GetAxis("Mouse Y") * 3);
		
		cursorRect.center += cursorMove;
				
		if(Vector2.Distance(cursorRect.center, radialRect.center) > (radialRect.width / 2.2))
		{
			cursorRect.center = ((cursorRect.center - radialRect.center).normalized * (radialRect.width / 2.2)) + radialRect.center;
		}

		//does not limit number of options
		for(var op : int; op < availableActions.length; op++)
		{
			var radians = ((op * 45) * Mathf.PI) / 180;
			var optionRect : Rect = Rect(radialRect.center.x - (optionSize.x / 2) + Mathf.Cos(radians) * (radialRect.width / 3), radialRect.center.y - (optionSize.y / 2) -Mathf.Sin(radians) * (radialRect.width / 3), optionSize.x, optionSize.y);
			
			if(optionRect.Contains(cursorRect.center))
			{
				var newOptionSize : Vector2 = optionSize * 1.5;
							
				optionRect = Rect(radialRect.center.x - (newOptionSize.x / 2) + Mathf.Cos(radians) * (radialRect.width / 3), radialRect.center.y - (newOptionSize.y / 2) - Mathf.Sin(radians) * (radialRect.width / 3), newOptionSize.x, newOptionSize.y);
				
				actionFunction = availableActions[op].actionFunction;
				
				selectingAction = true;
			}
						
			GUI.Label(optionRect, availableActions[op].icon);
		}
		
		if(actionFunction && !selectingAction)
			actionFunction = null;
				
		selectingAction = false;
		
		/*
		//Limits number of options
		if(optionTextures.length > 0)
		{
			for(var angle : float; angle < 360; angle += 30)
			{
				if((angle / 30) > optionTeextures.length)
					break;
								
				var radians = (angle * Mathf.PI) / 180;
				
				GUI.Label(Rect(radialRect.center.x + Mathf.Cos(radians) * (radialRect.width / 3), radialRect.center.y + Mathf.Sin(radians) * (radialRect.width / 3), 20, 20), optionTexture[angle / 30]);
			}
		}
		*/
							
		GUI.Label(cursorRect, cursor);
	}
}

public class ActionOption
{
	var available : boolean = false;
	var icon : Texture;
	//var rect : Rect;
	var actionFunction : Function;
}