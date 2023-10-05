#!/bin/bash

if [ $CONTEXT = "deploy-preview"  ] ; then 
	export VITE_CONVEX_URL=$(npx convex preview $HEAD --run 'init:reset') && npm run build
elif [ $CONTEXT = "production" ]; then  
   npm run build && npx convex deploy
else
	echo "No dev command"
fi
