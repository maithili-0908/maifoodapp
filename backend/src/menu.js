const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=85`;

const categories = [
  {
    category: "Pizza",
    items: [
      ["truffle-mushroom-pizza", "Truffle mushroom pizza", "Roasted mushrooms, mozzarella, truffle oil & fresh thyme.", 549, "photo-1579751626657-72bc17010498", "Bestseller"],
      ["garden-margherita-pizza", "Garden Margherita pizza", "San Marzano tomato, creamy mozzarella & basil.", 449, "photo-1574071318508-1cdbab80d002", "Classic"],
      ["smoky-paneer-pizza", "Smoky paneer pizza", "Tandoori paneer, peppers, red onion & mint drizzle.", 499, "photo-1513104890138-7c749659a591", "Spicy favorite"],
      ["farmhouse-feast-pizza", "Farmhouse feast pizza", "Roasted vegetables, olives, sweet corn & mozzarella.", 479, "photo-1604382355076-af4b0eb60143", "Garden fresh"],
      ["pepper-chicken-pizza", "Pepper chicken pizza", "Peppery chicken, caramelized onion & stretchy cheese.", 579, "photo-1571407970349-bc81e7e96d47", "House special"]
    ],
    time: 20
  },
  {
    category: "Burgers",
    items: [
      ["tava-fried-burger", "Tava fried burger", "Spiced potato patty, crisp lettuce & tangy house chutney.", 229, "photo-1568901346375-23c9450c58cd", "Street style"],
      ["smash-classic-burger", "Smash classic burger", "Double smash patty, aged cheddar, house sauce & pickles.", 349, "photo-1550547660-d9450f859349", "Fan favorite"],
      ["crispy-chicken-burger", "Crispy chicken burger", "Buttermilk chicken, slaw, tomato & spicy honey mayo.", 329, "photo-1553979459-d2229ba7433b", "So good"],
      ["paneer-tikka-burger", "Paneer tikka burger", "Charred tikka paneer, crunchy slaw & mint yogurt.", 279, "photo-1571091718767-18b5b1457add", "Veg favorite"],
      ["bbq-bean-burger", "BBQ bean burger", "Smoky bean patty, melted cheese & sweet BBQ sauce.", 259, "photo-1561758033-d89a9ad46330", "Plant based"]
    ],
    time: 18
  },
  {
    category: "Bowls",
    items: [
      ["miso-salmon-bowl", "Miso salmon bowl", "Glazed salmon, avocado, crisp greens & ginger rice.", 599, "photo-1512621776951-a57141f2eefd", "Fresh pick"],
      ["green-goddess-bowl", "Green goddess bowl", "Crispy chickpeas, avocado, greens & lemon tahini.", 329, "photo-1540420773420-3366772f4999", "Plant based"],
      ["teriyaki-chicken-bowl", "Teriyaki chicken bowl", "Sticky teriyaki chicken with greens and sesame rice.", 429, "photo-1511690743698-d9d85f2fbf38", "Protein packed"],
      ["rainbow-tofu-bowl", "Rainbow tofu bowl", "Golden tofu, crunchy vegetables & ginger-lime dressing.", 359, "photo-1490645935967-10de6ba17061", "Colorful & fresh"],
      ["spiced-paneer-bowl", "Spiced paneer bowl", "Warm masala paneer, brown rice & cooling cucumber.", 389, "photo-1547592180-85f173990554", "House favorite"]
    ],
    time: 22
  },
  {
    category: "Milkshakes",
    items: [
      ["strawberry-dream-milkshake", "Strawberry dream milkshake", "Real strawberries blended with vanilla bean ice cream.", 199, "photo-1572490122747-3968b75cc699", "Made fresh"],
      ["chocolate-fudge-milkshake", "Chocolate fudge milkshake", "Thick chocolate shake with a rich fudge swirl.", 219, "photo-1553787499-6f9133860278", "Chocolate fix"],
      ["mango-cream-milkshake", "Mango cream milkshake", "Alphonso mango and creamy chilled milk.", 209, "photo-1546173159-315724a31696", "Seasonal"],
      ["oreo-crunch-milkshake", "Oreo crunch milkshake", "Vanilla shake blended with chocolate cookie pieces.", 229, "photo-1577805947697-89e18249d767", "Cookie crush"],
      ["classic-vanilla-milkshake", "Classic vanilla milkshake", "Cool, creamy vanilla made with real ice cream.", 179, "photo-1579954115545-a95591f28bfc", "The original"]
    ],
    time: 8
  },
  {
    category: "Fresh Juice",
    items: [
      ["mango-sunshine-fresh-juice", "Mango sunshine fresh juice", "Fresh mango, a squeeze of lime, and absolutely no fuss.", 149, "photo-1600271886742-f049cd451bba", "Fresh pressed"],
      ["orange-glow-fresh-juice", "Orange glow fresh juice", "Sweet oranges squeezed fresh to order.", 129, "photo-1547514701-42782101795e", "Vitamin C"],
      ["watermelon-mint-fresh-juice", "Watermelon mint fresh juice", "Juicy watermelon, cooling mint & a squeeze of lime.", 119, "photo-1587049352846-4a222e784d38", "Super refreshing"],
      ["pineapple-zing-fresh-juice", "Pineapple zing fresh juice", "Bright pineapple juice with a little ginger kick.", 139, "photo-1550258987-190a2d41a8ba", "A little zing"],
      ["carrot-apple-fresh-juice", "Carrot apple fresh juice", "Fresh carrot and crisp apple, blended just right.", 129, "photo-1613478223719-2ab802602423", "Feel good"]
    ],
    time: 7
  },
  {
    category: "Biriyani",
    items: [
      ["hyderabadi-chicken-biriyani", "Hyderabadi chicken biriyani", "Fragrant dum-cooked basmati, tender chicken & warm spices.", 349, "photo-1512058564366-18510be2db19", "House favorite"],
      ["dum-veg-biriyani", "Dum veg biriyani", "Slow-cooked basmati layered with garden vegetables.", 269, "photo-1589302168068-964664d93dc0", "Veg favorite"],
      ["paneer-tikka-biriyani", "Paneer tikka biriyani", "Smoky paneer tikka tucked into aromatic dum rice.", 299, "photo-1631452180519-c014fe946bc7", "Smoky & rich"],
      ["pepper-chicken-biriyani", "Pepper chicken biriyani", "Pepper-spiced chicken, fragrant rice & cooling raita.", 369, "photo-1625944525533-473f1a3d54e7", "Spice lover"],
      ["egg-masala-biriyani", "Egg masala biriyani", "Boiled eggs in warming masala with saffron basmati.", 289, "photo-1599043513900-ed6fe01d3833", "Comfort meal"]
    ],
    time: 25
  },
  {
    category: "Pasta",
    items: [
      ["creamy-pesto-pasta", "Creamy pesto pasta", "Silky basil pesto, parmesan & toasted pine nuts.", 329, "photo-1473093295043-cdd812d0e601", "Comfort food"],
      ["spicy-arrabbiata-pasta", "Spicy arrabbiata pasta", "Penne tossed in a lively tomato and chili sauce.", 289, "photo-1551183053-bf91a1d81141", "A little heat"],
      ["alfredo-mushroom-pasta", "Alfredo mushroom pasta", "Creamy parmesan sauce with golden sautéed mushrooms.", 349, "photo-1556761223-4c4282c73f77", "Creamy favorite"],
      ["chicken-pink-sauce-pasta", "Chicken pink sauce pasta", "Tender chicken in a velvety tomato-cream sauce.", 379, "photo-1547592180-85f173990554", "Rich & cozy"],
      ["roasted-veg-pasta", "Roasted veg pasta", "Roasted seasonal vegetables with garlic olive oil.", 309, "photo-1555949258-eb67b1ef0ceb", "Garden fresh"]
    ],
    time: 18
  },
  {
    category: "Cakes",
    items: [
      ["chocolate-fudge-cake", "Chocolate fudge cake", "Deep chocolate sponge layered with silky fudge frosting.", 189, "photo-1578985545062-69928b1d9587", "Sweet treat"],
      ["red-velvet-cake", "Red velvet cake", "Soft cocoa sponge with a smooth cream-cheese frosting.", 209, "photo-1571115177098-24ec42ed204d", "Celebration pick"],
      ["lemon-drizzle-cake", "Lemon drizzle cake", "Light, buttery cake with a bright citrus glaze.", 169, "photo-1519869325930-281384150729", "Little sunshine"],
      ["black-forest-cake", "Black forest cake", "Chocolate, whipped cream & cherries in every layer.", 219, "photo-1606313564200-e75d5e30476c", "All-time classic"],
      ["caramel-crunch-cake", "Caramel crunch cake", "Vanilla sponge, salted caramel & a crunchy topping.", 199, "photo-1602351447937-745cb720612f", "Sweet & salty"]
    ],
    time: 10
  },
  {
    category: "Waffles",
    items: [
      ["berry-belgian-waffle", "Berry Belgian waffle", "Golden, crisp waffle with berries & a little maple drizzle.", 249, "photo-1562376552-0d160a2f238d", "Weekend mood"],
      ["chocolate-chip-waffle", "Chocolate chip waffle", "Warm Belgian waffle packed with chocolate chips.", 229, "photo-1528207776546-365bb710ee93", "Chocolate fix"],
      ["banana-maple-waffle", "Banana maple waffle", "Fresh banana, toasted pecans & a pour of maple syrup.", 239, "photo-1484723091739-30a097e8f929", "Brunch favorite"],
      ["strawberry-cream-waffle", "Strawberry cream waffle", "Sweet strawberries and a cloud of whipped cream.", 259, "photo-1517433670267-08bbd4be890f", "Berry lovely"],
      ["savory-paneer-waffle", "Savory paneer waffle", "Crisp savory waffle with spiced paneer and mint yogurt.", 279, "photo-1499636136210-6f4ee915583e", "Unexpected favorite"]
    ],
    time: 12
  }
];

export const menu = categories.flatMap(({ category, items, time }) =>
  items.map(([id, name, description, price, imageId, tag], index) => ({
    id,
    name,
    description,
    price,
    category,
    image: photo(imageId),
    rating: [4.9, 4.8, 4.7, 4.8, 4.9][index],
    time: `${time} min`,
    preparationMinutes: time,
    tag
  }))
);
