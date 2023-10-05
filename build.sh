#!/bin/bash

if [ $CONTEXT = "deploy-preview"  ] ; then 
	export NEXT_PUBLIC_CONVEX_URL=$(npx convex preview $HEAD --run 'init:reset') && next build
elif [ $CONTEXT = "production" ]; then  
   next build && npx convex deploy
else
	echo "No dev command"
fi
